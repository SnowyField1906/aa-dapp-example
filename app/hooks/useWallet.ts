import { useState, useEffect, useCallback } from 'react';
import { ethers, TransactionReceipt } from 'ethers';
import { TransactionResponse } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';

const TARGET_WALLET = 'http://localhost:3000/transaction_signing';

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
    ? TransactionReceipt
    : T extends EChain.SOLANA
    ? TransactionResponse
    : never;
};

export type PublicUserWallet<T extends EChain> = {
  address: string;
  chain: T;
};

const useWallet = (chain: EChain) => {
  const [userWallet, setUserWallet] =
    useState<PublicUserWallet<typeof chain>>();
  const [transactionResult, setTransactionResult] =
    useState<TransactionResult<typeof chain>>();

  const _popup = (): Window =>
    window.open(TARGET_WALLET, 'popup', 'width=600,height=800')!;

  const login = useCallback(() => {
    const walletWindow = _popup();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'READY') {
        walletWindow.postMessage({ type: 'DERIVE_ADDRESS_REQUEST' }, '*');
      }

      if (event.data.type === 'DERIVE_ADDRESS_RESPONSE') {
        const { address, chain } = event.data;
        setUserWallet({ address, chain });
        walletWindow.close();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const logout = () => {
    setUserWallet(undefined);
    setTransactionResult(undefined);
  };

  const sendTransaction = useCallback(
    async (payload: TransactionPayload<typeof chain>) => {
      if (!userWallet) throw new Error('User wallet not found');
      const walletWindow = _popup();

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'READY') {
          walletWindow.postMessage(
            { type: 'SIGN_TRANSACTION_REQUEST', payload, userWallet },
            '*'
          );
        }
        if (event.data.type === 'SIGN_TRANSACTION_RESPONSE') {
          setTransactionResult(event.data.transactionResult);
          walletWindow.close();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    },
    [userWallet, transactionResult]
  );

  const transferToken = useCallback(
    async (payload: TransferTokenPayload) => {
      if (!userWallet) throw new Error('User wallet not found');
      const walletWindow = _popup();

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'READY') {
          walletWindow.postMessage(
            { type: 'TRANSFER_TOKEN_REQUEST', payload, userWallet },
            '*'
          );
        }
        if (event.data.type === 'TRANSFER_TOKEN_RESPONSE') {
          setTransactionResult(event.data.transactionStatus);
          walletWindow.close();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    },
    [userWallet, transactionResult]
  );

  const transferNative = useCallback(
    async (payload: TransferNativePayload) => {
      if (!userWallet) throw new Error('User wallet not found');
      const walletWindow = _popup();

      const handleNativeMessage = (event: MessageEvent) => {
        if (event.data.type === 'READY') {
          walletWindow.postMessage(
            { type: 'TRANSFER_NATIVE_REQUEST', payload, userWallet },
            '*'
          );
        }
        if (event.data.type === 'TRANSFER_NATIVE_RESPONSE') {
          setTransactionResult(event.data.transactionStatus);
          walletWindow.close();
        }
      };

      window.addEventListener('message', handleNativeMessage);
      return () => window.removeEventListener('message', handleNativeMessage);
    },
    [userWallet, transactionResult]
  );

  return {
    userWallet,
    transactionResult,
    login,
    logout,
    sendTransaction,
    transferToken,
    transferNative,
  };
};

export default useWallet;
