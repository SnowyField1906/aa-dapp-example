'use client';

import { createContext, useContext, ReactNode } from 'react';
import useWallet from '../hooks/useWallet';
import { EChain } from '../types';

type WalletContextType = ReturnType<typeof useWallet> | null;

const WalletContext = createContext<WalletContextType>(null);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
};

const WalletProvider = ({
  children,
  chain,
}: {
  children: ReactNode;
  chain: EChain;
}) => {
  const wallet = useWallet(chain);
  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
};

export default WalletProvider;
