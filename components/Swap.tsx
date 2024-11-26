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
import { EChain, TransactionResponse } from '@aawallet-sdk/types'
import { computeMaxSpent, computeMinReceived, parseTokenValue } from '@utils/offchain/tokens'
import UpdateConfigsModal from './UpdateConfigsModal'

const Swap = () => {
  const { userWallet, login, sendTransaction, waitTransaction } = useWalletContext()
  const { swapMetadata, swapConfigs, staticSwapResult, handleFlipOrder, handleUpdateBalance } =
    useStaticSwapContext()
  const [step, setStep] = useState<
    | 'GUEST'
    | 'INPUT'
    | 'CONFIRMING_APPROVE'
    | 'CONFIRMING_SWAP'
    | 'CANCELED'
    | 'APPROVING'
    | 'SWAPPING'
    | 'SUCCESS'
    | 'FAILED'
  >(userWallet ? 'INPUT' : 'GUEST')
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
      uniqueAddresses.map((address) =>
        getAllowance(address, userWallet!.address, ROUTER_ADDRESS).then((allowance) =>
          allowance === '0' ? address : ''
        )
      )
    ).then((addresses) => addresses.filter((address) => address !== ''))

    /// Approve all tokens
    let approved = true
    for (const address of approvalsNeeded) {
      const contractInterface = new ethers.Interface(I_ERC20_ABI)
      const data = contractInterface.encodeFunctionData('approve', [ROUTER_ADDRESS, MAX_UINT256])
      await sendTransaction({
        from: userWallet!.address,
        to: address,
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
      const [tokenIn, tokenOut] = route.reduce(
        (acc, hop) => [acc[0] + BigInt(hop.amountIn), acc[1] + BigInt(hop.amountOut)],
        [BigInt(0), BigInt(0)]
      )

      if (swapMetadata.tradeType === TradeType.EXACT_INPUT) {
        const exactIn = tokenIn.toString()
        const minReceived = computeMinReceived(tokenOut.toString(), swapConfigs.slippage)

        const args = [path, userWallet!.address, exactIn, minReceived]
        calls.push(contractInterface.encodeFunctionData('exactInput', [args]))
      } else {
        const exactOut = tokenOut.toString()
        const maxSpent = computeMaxSpent(tokenIn.toString(), swapConfigs.slippage)

        const args = [path, userWallet!.address, exactOut.toString(), maxSpent.toString()]
        calls.push(contractInterface.encodeFunctionData('exactOutput', [args]))
      }
    }

    /// Execute multi-call
    const response = (await sendTransaction({
      from: userWallet!.address,
      to: ROUTER_ADDRESS,
      gasLimit: swapMetadata.gasToPay,
      value: '0',
      data: contractInterface.encodeFunctionData('multicall(bytes[])', [calls]),
    })) as TransactionResponse<EChain.ETHEREUM>

    console.log('Transaction response: ', response)

    if (response.success) {
      setStep('SWAPPING')
      setHash(response.signed.hash)
      const receipt = await waitTransaction(response.signed.hash)

      console.log('Transaction receipt: ', receipt)

      if (receipt.success) {
        setStep('SUCCESS')
      } else {
        alert(`Transaction failed with reason: ${receipt.error.message}`)
        setStep('FAILED')
      }
    } else {
      alert(`Signing failed with reason: ${response.error.message}`)
      setStep('CANCELED')
    }
    await Promise.all([
      handleUpdateBalance(InputType.BASE, userWallet!.address),
      handleUpdateBalance(InputType.QUOTE, userWallet!.address),
    ])
  }

  useEffect(() => {
    setStep('INPUT')
    setHash(undefined)
  }, [staticSwapResult])
  useEffect(() => {
    setStep(userWallet ? 'INPUT' : 'GUEST')
    setHash(undefined)
  }, [userWallet])

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
              CANCELED: 'Canceled',
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
