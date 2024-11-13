import { useState, useCallback } from 'react';
import {
  EChain,
  PublicUserWallet,
  TransactionPayload,
  TransactionResult,
  TransferNativePayload,
  TransferTokenPayload,
} from '../types';

const TARGET_WALLET = 'http://localhost:3000/transaction_signing';

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
