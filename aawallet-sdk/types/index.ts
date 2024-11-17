import {
	Transaction as SolanaTransactionRequest,
	TransactionResponse as SolanaTransactionResponse,
} from '@solana/web3.js'
import {
	TransactionRequest as EthereumTransactionRequest,
	TransactionResponse as EthereumTransactionResponse,
	TransactionReceipt as EthereumTransactionReceipt,
} from 'ethers'

export enum EChain {
	ETHEREUM = 'ETHEREUM',
	SOLANA = 'SOLANA',
}

export type TransactionRequest<T extends EChain = EChain> =
	T extends EChain.ETHEREUM
		? EthereumTransactionRequest
		: T extends EChain.SOLANA
			? SolanaTransactionRequest
			: never

export type TransferNativePayload = {
	recipient: string
	amount: string
}
export type TransferTokenPayload = {
	recipient: string
	amount: string
	tokenAddress: string
}

export type TransactionResponse<T extends EChain = EChain> =
	| {
			success: true
			signed: T extends EChain.ETHEREUM
				? EthereumTransactionResponse
				: T extends EChain.SOLANA
					? string // ? SolanaTransactionResponse
					: never
	  }
	| { success: false; error: Error }

export type TransactionReceipt<T extends EChain = EChain> =
	| {
			success: true
			receipt: T extends EChain.ETHEREUM
				? EthereumTransactionReceipt
				: T extends EChain.SOLANA
					? SolanaTransactionResponse
					: never
	  }
	| { success: false; error: Error }

export type PublicUserWallet<T extends EChain = EChain> = {
	address: string
	chain: T
}

export type PostMessageData<T extends EChain = EChain> =
	PostMessageRequest<T> & {
		origin: string
	}
export type PostMessageRequest<T extends EChain = EChain> = {
	type:
		| 'DERIVE_ADDRESS_REQUEST'
		| 'SIGN_TRANSACTION_REQUEST'
		| 'TRANSFER_TOKEN_REQUEST'
		| 'TRANSFER_NATIVE_REQUEST'
	payload?: TransactionRequest<T>
	userWallet?: PublicUserWallet<T>
}
