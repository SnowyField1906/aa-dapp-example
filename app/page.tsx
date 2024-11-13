'use client';

import React, { useState, useEffect } from 'react';

import { useWalletContext } from './@aawallet-sdk';
import { OffChainToken } from './utils/types';
import { getTokenList } from './utils/offchain/tokens';
import Swap from './components/Swap';

const App = () => {
  const [tokenList, setTokenList] = useState<OffChainToken[]>([]);

  const { userWallet, login, logout } = useWalletContext();

  useEffect(() => {
    (async () => {
      const tokenList: OffChainToken[] = await getTokenList();
      console.log(tokenList);
      setTokenList(tokenList);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="h-16 w-full flex items-center justify-between px-6">
        <div className="text-white text-lg">AAWallet Demo</div>
        <div className="flex gap-6">
          {userWallet ? (
            <>
              <p className="text-white">{userWallet.address}</p>
              <button
                className="text-white py-2 px-5 bg-gray-800 rounded-lg"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="text-white py-2 px-5 bg-gray-800 rounded-lg"
              onClick={login}
            >
              Login
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 mt-6">
        <Swap tokenList={tokenList} />
      </div>
    </div>
  );
};

export default App;
