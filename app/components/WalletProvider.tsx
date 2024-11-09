'use client';

import { createContext, useContext, ReactNode } from 'react';
import useWallet, { EChain } from '../hooks/useWallet';

type WalletContextType = ReturnType<typeof useWallet> | null;

const WalletContext = createContext<WalletContextType>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWallet(EChain.ETHEREUM);

  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
};
