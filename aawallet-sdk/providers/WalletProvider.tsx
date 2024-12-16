'use client'

import { createContext, useContext, ReactNode } from 'react'
import useWallet from '../hooks/useWallet'
import { Network } from '@aawallet-sdk/types'

type WalletContextType = ReturnType<typeof useWallet> | null

const WalletContext = createContext<WalletContextType>(null)

export const useWalletContext = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider')
  }
  return context
}

const WalletProvider = ({ children, network }: { children: ReactNode; network: Network }) => {
  const wallet = useWallet(network)
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export default WalletProvider
