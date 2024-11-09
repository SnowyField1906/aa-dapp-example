'use client';

import React, { useState, useEffect } from 'react';
import { ethers, JsonRpcProvider } from 'ethers';

import {
  ETHEREUM_RPC_URL,
  ETHEREUM_CONTRACT_ADDRESS,
  ETHEREUM_ABI,
} from './utils/miscs';
import useWallet, { EChain } from './hooks/useWallet';
import { useWalletContext } from './components/WalletProvider';

const App = () => {
  const [ethCount, setEthCount] = useState<number>();
  const provider = new JsonRpcProvider(ETHEREUM_RPC_URL);
  const contract = new ethers.Contract(
    ETHEREUM_CONTRACT_ADDRESS,
    ETHEREUM_ABI,
    provider
  );

  const {
    userWallet,
    transactionResult,
    login,
    logout,
    sendTransaction,
    transferToken,
    transferNative,
  } = useWalletContext();

  const pingEthereum = async () => {
    await sendTransaction({
      contractAddress: ETHEREUM_CONTRACT_ADDRESS,
      gasLimit: '100000',
      value: '0',
      abi: ETHEREUM_ABI,
      functionFragment: 'ping',
      functionArguments: [],
    });
    const count = await contract.getPingCount(userWallet!.address);
    setEthCount(Number(count));
  };

  useEffect(() => {
    (async () => {
      if (!userWallet) return;
      const count = await contract.getPingCount(userWallet.address);
      setEthCount(Number(count));
    })();
  }, [userWallet, transactionResult]);

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

      <div className="grid grid-cols-2 gap-4 place-items-center mt-20">
        <div
          className={
            userWallet?.chain === 'ETHEREUM'
              ? 'opacity-100 place-items-center'
              : 'opacity-50 place-items-center'
          }
        >
          <h2 className="text-2xl text-black font-bold text-center mb-2">
            Ethereum
          </h2>
          <button
            onClick={pingEthereum}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Ping
          </button>
          <p className="text-black text-center">
            Count: {ethCount === undefined ? 'N/A' : ethCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
