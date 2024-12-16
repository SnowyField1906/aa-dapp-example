'use client'

import React, { useState, useEffect } from 'react'

import { useWalletContext } from '@aawallet-sdk'
import { OffChainToken } from '@utils/types'
import { getTokenList } from '@utils/offchain/tokens'
import Swap from '@components/Swap'

const App = () => {
  const { address, login, logout } = useWalletContext()

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex h-16 w-full items-center justify-between px-6">
        <div className="text-lg text-white">AAWallet Demo</div>
        <div className="flex gap-6">
          {address ? (
            <>
              <button className="rounded-full bg-gray-800 px-5 py-2 text-white hover:bg-gray-700">
                {address}
              </button>
              <button
                className="rounded-full bg-gray-800 px-5 py-2 text-white hover:bg-gray-700"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="rounded-full bg-gray-800 px-5 py-2 text-white hover:bg-gray-700"
              onClick={login}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-6">
        <Swap />
      </div>
    </div>
  )
}

export default App
