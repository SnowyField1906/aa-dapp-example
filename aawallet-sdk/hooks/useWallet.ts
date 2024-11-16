import { useState, useCallback, useRef } from 'react';
import {
  EChain,
  PublicUserWallet,
  TransactionRequest,
  TransactionResponse,
  TransferNativePayload,
  TransferTokenPayload,
} from '../types';

const TARGET_WALLET = 'http://localhost:3000/transaction_signing';

const useWallet = (chain: EChain) => {
  const [userWallet, setUserWallet] =
    useState<PublicUserWallet<typeof chain>>();
  const [transactionResponse, setTransactionResponse] =
    useState<TransactionResponse<typeof chain>>();

  const _popup = (): Window => {
    const popupName = `popup-${Date.now()}`;
    return window.open(TARGET_WALLET, popupName, 'width=600,height=800')!;
  };

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
    setTransactionResponse(undefined);
  };

  const transactionQueue = useRef<(() => Promise<void>)[]>([]);

  const processQueue = useCallback(async () => {
    while (transactionQueue.current.length > 0) {
      const transaction = transactionQueue.current.shift();
      if (transaction) await transaction();
    }
  }, []);

  const queueTransaction = useCallback(
    (transaction: () => Promise<void>) => {
      transactionQueue.current.push(transaction);
      if (transactionQueue.current.length === 1) {
        processQueue();
      }
    },
    [processQueue]
  );

  const sendTransaction = useCallback(
    async (payload: TransactionRequest<typeof chain>): Promise<void> => {
      if (!userWallet) throw new Error('User wallet not found');
      queueTransaction(async () => {
        const walletWindow = _popup();

        return new Promise<void>((resolve) => {
          const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'READY') {
              walletWindow.postMessage(
                { type: 'SIGN_TRANSACTION_REQUEST', payload, userWallet },
                '*'
              );
            }
            if (event.data.type === 'SIGN_TRANSACTION_RESPONSE') {
              setTransactionResponse(event.data.signed);
              walletWindow.close();
              resolve();
            }
          };

          window.addEventListener('message', handleMessage, { once: true });
        });
      });
    },
    [userWallet, queueTransaction]
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
          setTransactionResponse(event.data.signed);
          walletWindow.close();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    },
    [userWallet]
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
          setTransactionResponse(event.data.signed);
          walletWindow.close();
        }
      };

      window.addEventListener('message', handleNativeMessage);
      return () => window.removeEventListener('message', handleNativeMessage);
    },
    [userWallet]
  );

  return {
    userWallet,
    transactionResponse,
    login,
    logout,
    sendTransaction,
    transferToken,
    transferNative,
  };
};

export default useWallet;
