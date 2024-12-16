import solana from '@solana/web3.js'
import * as ethers from 'ethers'

export enum Network {
    ETH = 1,
    TETHSPL = 11155111,
    SOLANA = 101,
}
export enum ResponseCode {
    SUCCESS = 0,
    ERROR = 1,
}

export type MessageType = (typeof MESSAGE_TYPES)[number]
export type Result<T> = {
    code: ResponseCode
    message: string
    result?: T
}

/// Transaction Mappings

export type EthereumMapping = {
    Request: ethers.TransactionRequest
    Response: ethers.TransactionResponse
    Receipt: ethers.TransactionReceipt
}
export type SolanaMapping = {
    Request: solana.Transaction
    Response: solana.TransactionResponse
    Receipt: solana.TransactionResponse
}
export type Transaction<N extends Network = Network> = {
    [Network.ETH]: EthereumMapping
    [Network.TETHSPL]: EthereumMapping
    [Network.SOLANA]: SolanaMapping
}[N]

/// Transaction Interfaces

export type TransactionRequest<N extends Network = Network> = Transaction<N>['Request']
export type TransactionResponse<N extends Network = Network> = Transaction<N>['Response']
export type TransactionReceipt<N extends Network = Network> = Transaction<N>['Receipt']

/// Message Mappings

export type ConnectWalletMapping = {
    Request: undefined
    Response: string
}
export type SignTransactionMapping<N extends Network = Network> = {
    Request: TransactionRequest<N>
    Response: TransactionResponse<N>
}
export type Payload<N extends Network = Network, T extends MessageType = MessageType> = {
    ['SIGN_TRANSACTION']: SignTransactionMapping<N>
    ['CONNECT_WALLET']: ConnectWalletMapping
}[T]

/// Message Interfaces

export type MessageRequest<N extends Network = Network, T extends MessageType = MessageType> = {
    type: T
    network: N
    payload: Payload<N, T>['Request']
}
export type MessageResponse<N extends Network = Network, T extends MessageType = MessageType> = {
    type: T
    network: N
    payload: Result<Payload<N, T>['Response']>
}

/// Constants

export const MESSAGE_TYPES = ['SIGN_TRANSACTION', 'CONNECT_WALLET'] as const

export const NETWORK_DETAILS = {
    [Network.ETH]: { name: 'Ethereum Mainnet' },
    [Network.TETHSPL]: { name: 'Ethereum Sepolia (Testnet)' },
    [Network.SOLANA]: { name: 'Solana Mainnet' },
}
