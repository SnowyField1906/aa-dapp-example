import { TransactionResponse } from '@solana/web3.js';
import { Transaction } from 'ethers';

export enum EChain {
  ETHEREUM = 'ETHEREUM',
  SOLANA = 'SOLANA',
}

export type EthereumTransactionPayload = {
  contractAddress: string;
  gasLimit: string;
  value: string;
  abi: any;
  functionFragment: string;
  functionArguments: string[];
};
export type SolanaTransactionPayload = {
  programId: string;
  instruction: string;
  idl: string;
};
export type TransactionPayload<T extends EChain> = T extends EChain.ETHEREUM
  ? EthereumTransactionPayload
  : T extends EChain.SOLANA
  ? SolanaTransactionPayload
  : never;

export type TransferNativePayload = {
  recipient: string;
  amount: string;
};
export type TransferTokenPayload = {
  recipient: string;
  amount: string;
  tokenAddress: string;
};

export type TransactionResult<T extends EChain> = {
  success: boolean;
  receipt?: T extends EChain.ETHEREUM
    ? Transaction
    : T extends EChain.SOLANA
    ? TransactionResponse
    : never;
};

export type PublicUserWallet<T extends EChain> = {
  address: string;
  chain: T;
};
