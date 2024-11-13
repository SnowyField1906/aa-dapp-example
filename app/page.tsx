'use client';

import React, { useState, useEffect } from 'react';
import { ethers, JsonRpcProvider } from 'ethers';

import { useWalletContext } from './@aawallet-sdk';
import { OffChainToken } from './utils/types';
import { getTokenList } from './utils/offchain/tokens';

const App = () => {
  const [tokenList, setTokenList] = useState<OffChainToken[]>([]);

  const {
    userWallet,
    transactionResult,
    login,
    logout,
    sendTransaction,
    transferToken,
    transferNative,
  } = useWalletContext();

  useEffect(() => {
    (async () => {
      const tokenList: OffChainToken[] = await getTokenList();
      console.log(tokenList);
      setTokenList(tokenList);
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl text-black font-bold text-center mb-6">
        Ping Counter for wallet {userWallet?.address}
      </h1>
      {userWallet ? (
        <button
          onClick={logout}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-700 transition duration-200"
        >
          Logout
        </button>
      ) : (
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Login
        </button>
      )}
    </div>
  );
};

export default App;
