'use client'

import { FaCog, FaExchangeAlt } from 'react-icons/fa'
import { Address, InputType, UniswapStaticHop } from '@utils/types'
import TokenInput from './TokenInput'
import SwapMetadata from './SwapMetadata'
import { useStaticSwapContext } from '@providers/StaticSwapProvider'
import { useWalletContext } from '@aawallet-sdk'
import { I_ERC20_ABI, I_ROUTER_ABI, MAX_UINT256, ROUTER_ADDRESS } from '@utils/constants'
import { getAllowance } from '@utils/onchain/tokens'
import { TradeType } from '@uniswap/sdk-core'
import { constructPath } from '@utils/offchain/uniswap'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import {
  Network,
  ResponseCode,
  Result,
  TransactionReceipt,
  TransactionResponse,
} from '@aawallet-sdk/types'
import {
  computeMaxSpent,
  computeMinReceived,
  isNativeToken,
  parseTokenValue,
} from '@utils/offchain/tokens'
import UpdateConfigsModal from './UpdateConfigsModal'
import { set } from '@coral-xyz/anchor/dist/cjs/utils/features'

const Swap = () => {
  const { address, login, sendTransaction, waitTransaction } = useWalletContext()
  const {
    selectedTokenPair,
    inputValuePair,
    swapMetadata,
    swapConfigs,
    staticSwapResult,
    handleFlipOrder,
    handleUpdateBalance,
  } = useStaticSwapContext()
  const [step, setStep] = useState<
    | 'GUEST'
    | 'INPUT'
    | 'CONFIRMING_APPROVE'
    | 'CONFIRMING_SWAP'
    | 'CANCELLED'
    | 'APPROVING'
    | 'SWAPPING'
    | 'SUCCESS'
    | 'FAILED'
  >(address ? 'INPUT' : 'GUEST')
  const [hash, setHash] = useState<string>()
  const [openConfigsModal, setOpenConfigsModal] = useState<boolean>(false)

  const executeSwap = async () => {
    setStep('CONFIRMING_APPROVE')
    const hops: UniswapStaticHop[] = staticSwapResult!.route.flat()

    /// Check if all tokens are approved
    const uniqueAddresses: Address[] = Array.from(
      new Set(hops.map((hop) => [hop.tokenIn.address, hop.tokenOut.address]).flat())
    )
    const approvalsNeeded: Address[] = await Promise.all(
      uniqueAddresses.map((erc20Address) =>
        getAllowance(erc20Address, address!, ROUTER_ADDRESS).then((allowance) =>
          allowance === '0' ? address : ''
        )
      )
    ).then((res) => res.filter((e) => e !== '') as Address[])

    /// Approve all tokens
    let approved = true
    for (const erc20Address of approvalsNeeded) {
      const contractInterface = new ethers.Interface(I_ERC20_ABI)
      const data = contractInterface.encodeFunctionData('approve', [ROUTER_ADDRESS, MAX_UINT256])
      await sendTransaction({
        from: address,
        to: erc20Address,
        gasLimit: '100000',
        value: '0',
        data,
      }).catch(() => {
        approved = false
      })
    }
    if (!approved) {
      alert('Not all tokens were approved')
      setStep('FAILED')
      return
    }

    setStep('CONFIRMING_SWAP')

    /// Group routes into one for multi-call
    const calls: string[] = []
    const contractInterface = new ethers.Interface(I_ROUTER_ABI)

    for (const route of staticSwapResult!.route) {
      const path = constructPath(route, swapMetadata.tradeType)
      const [amountIn, amountOut] = route.reduce(
        (acc, hop) => [acc[0] + BigInt(hop.amountIn ?? '0'), acc[1] + BigInt(hop.amountOut ?? '0')],
        [BigInt(0), BigInt(0)]
      )

      const recipient = route.length > 1 ? '0x0000000000000000000000000000000000000002' : address

      if (swapMetadata.tradeType === TradeType.EXACT_INPUT) {
        const exactIn = amountIn.toString()
        const minReceived = computeMinReceived(amountOut.toString(), swapConfigs.slippage)
        const args = [path, recipient, exactIn, minReceived]
        calls.push(contractInterface.encodeFunctionData('exactInput', [args]))
      } else {
        const exactOut = amountOut.toString()
        const maxSpent = computeMaxSpent(amountIn.toString(), swapConfigs.slippage)
        const args = [path, recipient, exactOut, maxSpent]
        calls.push(contractInterface.encodeFunctionData('exactOutput', [args]))
      }
    }

    let value = '0'

    // if pay ETH, set a appropriate amount of value
    if (isNativeToken(selectedTokenPair[InputType.BASE]!)) {
      const amount =
        swapMetadata.tradeType === TradeType.EXACT_INPUT
          ? inputValuePair[InputType.BASE]
          : parseTokenValue(swapMetadata.maximumSpent, selectedTokenPair[InputType.BASE]!.decimals)

      value = amount
      calls.push(contractInterface.encodeFunctionData('refundETH', []))
    }

    // if receive ETH, unwrap WETH after finishing swap
    if (isNativeToken(selectedTokenPair[InputType.QUOTE]!)) {
      const amount =
        swapMetadata.tradeType === TradeType.EXACT_OUTPUT
          ? inputValuePair[InputType.QUOTE]
          : parseTokenValue(swapMetadata.minimumReceived, selectedTokenPair[InputType.QUOTE]!.decimals)

      const args = [amount]
      calls.push(contractInterface.encodeFunctionData('unwrapWETH9(uint256)', args))
    }

    /// Execute multi-call
    const response = (await sendTransaction({
      from: address,
      to: ROUTER_ADDRESS,
      gasLimit: swapMetadata.gasToPay,
      data: contractInterface.encodeFunctionData('multicall(bytes[])', [calls]),
      value,
    })) as Result<TransactionResponse<Network.ETH>>

    console.log('Transaction response:', response)

    if (response.code === ResponseCode.SUCCESS) {
      setHash(response.result!.hash)

      const receipt = (await waitTransaction(response.result!.hash)) as Result<
        TransactionReceipt<Network.ETH>
      >

      console.log('Transaction receipt:', receipt)

      if (receipt.code === ResponseCode.SUCCESS) {
        setStep('SUCCESS')
      } else {
        alert(`Transaction failed with reason: ${receipt.message}`)
        setStep('FAILED')
      }
    } else {
      alert(`Signing failed with reason: ${response.message}`)
      setStep('CANCELLED')
    }
    await Promise.all([
      handleUpdateBalance(InputType.BASE, address!),
      handleUpdateBalance(InputType.QUOTE, address!),
    ])
  }

  useEffect(() => {
    setStep(address ? 'INPUT' : 'GUEST')
    setHash(undefined)
  }, [staticSwapResult])
  useEffect(() => {
    setStep(address ? 'INPUT' : 'GUEST')
    setHash(undefined)
  }, [address])

  return (
    <>
      {openConfigsModal && <UpdateConfigsModal onClose={() => setOpenConfigsModal(false)} />}
      <div className="w-2xl w-2xl mx-auto flex flex-col gap-6 rounded-lg bg-gray-900 p-6 text-white shadow-lg">
        <FaCog
          className="ml-auto cursor-pointer text-gray-400"
          onClick={() => setOpenConfigsModal(true)}
        />

        <hr className="border-gray-700" />

        <TokenInput input={InputType.BASE} />

        <div className="flex items-center justify-center">
          <FaExchangeAlt
            className="rotate-90 transform cursor-pointer text-gray-400"
            onClick={handleFlipOrder}
          />
        </div>

        <TokenInput input={InputType.QUOTE} />

        <SwapMetadata />

        <button
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
          disabled={step !== 'INPUT'}
          onClick={step === 'GUEST' ? login : executeSwap}
        >
          {
            {
              GUEST: 'Connect Wallet',
              INPUT: 'Swap',
              CONFIRMING_APPROVE: 'Confirming for approval',
              CONFIRMING_SWAP: 'Confirming for swap',
              CANCELLED: 'Cancelled',
              APPROVING: 'Approving token',
              SWAPPING: 'Executing swap',
              SUCCESS: 'Success',
              FAILED: 'Failed',
            }[step]
          }
        </button>
        {hash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank "
            rel="noreferrer"
            className="text-center text-sm text-blue-400 underline"
          >
            View transaction status on Etherscan
          </a>
        )}
      </div>
    </>
  )
}

export default Swap
