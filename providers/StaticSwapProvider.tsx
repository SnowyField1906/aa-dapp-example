'use client';

import { createContext, useContext, ReactNode } from 'react';
import useStaticSwap from '../hooks/useStaticSwap';

type StaticSwapContextType = ReturnType<typeof useStaticSwap> | null;

const StaticSwapContext = createContext<StaticSwapContextType>(null);

export const useStaticSwapContext = () => {
  const context = useContext(StaticSwapContext);
  if (!context) {
    throw new Error(
      'useStaticSwapContext must be used within StaticSwapProvider'
    );
  }
  return context;
};

const StaticSwapProvider = ({ children }: { children: ReactNode }) => {
  const staticSwap = useStaticSwap();
  return (
    <StaticSwapContext.Provider value={staticSwap}>
      {children}
    </StaticSwapContext.Provider>
  );
};

export default StaticSwapProvider;
