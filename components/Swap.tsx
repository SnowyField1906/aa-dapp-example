'use client'

import { FaCog, FaExchangeAlt } from 'react-icons/fa'
import { Address, InputType } from '@utils/types'
import TokenInput from './TokenInput'
import SwapMetadata from './SwapMetadata'
import { useStaticSwapContext } from '@providers/StaticSwapProvider'
import { useWalletContext } from '@aawallet-sdk'
import { I_ERC20_ABI, I_ROUTER_ABI, ROUTER_ADDRESS } from '@utils/constants'
import { getAllowance } from '@utils/onchain/tokens'
import { TradeType } from '@uniswap/sdk-core'
import { constructPath } from '@utils/offchain/uniswap'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

const Swap = () => {
	const { userWallet, login, sendTransaction, waitTransaction } =
		useWalletContext()
	const {
		selectedTokenPair,
		inputValuePair,
		swapMetadata,
		staticSwapResult,
		handleFlipOrder,
		handleUpdateBalance,
	} = useStaticSwapContext()
	const [step, setStep] = useState<
		| 'GUEST'
		| 'INPUT'
		| 'CONFIRMING'
		| 'CANCELED'
		| 'EXECUTING'
		| 'SUCCESS'
		| 'FAILED'
	>(userWallet ? 'INPUT' : 'GUEST')
	const [hash, setHash] = useState<string>()

	const executeSwap = async () => {
		setStep('CONFIRMING')
		const hops = staticSwapResult!.route.flat()

		const uniqueAddresses: Address[] = Array.from(
			new Set(
				hops.map((hop) => [hop.tokenIn.address, hop.tokenOut.address]).flat()
			)
		)
		const approvalsNeeded: Address[] = await Promise.all(
			uniqueAddresses.map((address) =>
				getAllowance(address, userWallet!.address, ROUTER_ADDRESS).then(
					(allowance) => (allowance === '0' ? address : '')
				)
			)
		).then((addresses) => addresses.filter((address) => address !== ''))

		for (const address of approvalsNeeded) {
			const contractInterface = new ethers.Interface(I_ERC20_ABI)
			const data = contractInterface.encodeFunctionData('approve', [
				ROUTER_ADDRESS,
				'115792089237316195423570985008687907853269984665640564039457584007913129639935',
			])
			await sendTransaction({
				from: userWallet!.address,
				to: address,
				gasLimit: '100000',
				value: '0',
				data,
			})
		}

		const contractInterface = new ethers.Interface(I_ROUTER_ABI)
		const data = contractInterface.encodeFunctionData(
			swapMetadata.tradeType === TradeType.EXACT_INPUT
				? 'exactInput'
				: 'exactOutput',
			[
				[
					constructPath(hops, swapMetadata.tradeType),
					userWallet!.address,
					inputValuePair[
						swapMetadata.tradeType === TradeType.EXACT_INPUT
							? InputType.BASE
							: InputType.QUOTE
					],
					swapMetadata.tradeType === TradeType.EXACT_INPUT
						? '1'
						: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
				],
			]
		)

		const response = await sendTransaction({
			from: userWallet!.address,
			to: ROUTER_ADDRESS,
			gasLimit: (Number(staticSwapResult!.gasUseEstimate) * 2).toString(),
			value: '0',
			data,
		})

		console.log('Transaction response: ', response)

		if (response.success) {
			setStep('EXECUTING')
			setHash(response.signed.hash)
			const receipt = await waitTransaction(response.signed.hash)
			console.log('Transaction receipt: ', receipt)
			setStep(receipt.success ? 'SUCCESS' : 'FAILED')
		} else {
			setStep('CANCELED')
		}

		await handleUpdateBalance(InputType.BASE, userWallet!.address)
		await handleUpdateBalance(InputType.QUOTE, userWallet!.address)
	}

	const isFinalStep =
		step === 'CANCELED' ||
		step === 'CONFIRMING' ||
		step === 'SUCCESS' ||
		step === 'FAILED'

	useEffect(() => {
		if (isFinalStep) {
			setStep('INPUT')
			setHash(undefined)
		}
	}, [staticSwapResult])
	useEffect(() => {
		setStep(userWallet ? 'INPUT' : 'GUEST')
		setHash(undefined)
	}, [userWallet])

	return (
		<div className="w-2xl w-2xl mx-auto flex flex-col gap-6 rounded-lg bg-gray-900 p-6 text-white shadow-lg">
			<FaCog className="ml-auto cursor-pointer text-gray-400" />

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
						CONFIRMING: 'Confirming',
						CANCELED: 'Canceled',
						EXECUTING: 'Executing',
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
	)
}

export default Swap
