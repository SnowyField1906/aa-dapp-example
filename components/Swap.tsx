'use client';

import { FaCog, FaExchangeAlt } from 'react-icons/fa';
import { Address, InputType } from '@utils/types';
import TokenInput from './TokenInput';
import SwapMetadata from './SwapMetadata';
import { useStaticSwapContext } from '@providers/StaticSwapProvider';
import { useWalletContext } from '@aawallet-sdk';
import { I_ERC20_ABI, I_ROUTER_ABI, ROUTER_ADDRESS } from '@utils/constants';
import { getAllowance } from '@utils/onchain/tokens';
import { TradeType } from '@uniswap/sdk-core';
import { constructPath } from '@utils/offchain/uniswap';
import { useState } from 'react';
import { ethers } from 'ethers';

const Swap = () => {
  const { userWallet, login, transactionResponse, sendTransaction } =
    useWalletContext();
  const {
    selectedTokenPair,
    inputValuePair,
    swapMetadata,
    staticSwapResult,
    handleFlipOrder,
  } = useStaticSwapContext();
  const [loading, setLoading] = useState(false);

  const executeSwap = async () => {
    setLoading(true);
    const hops = staticSwapResult!.route.flat();

    const uniqueAddresses: Address[] = Array.from(
      new Set(
        hops.map((hop) => [hop.tokenIn.address, hop.tokenOut.address]).flat()
      )
    );
    const approvalsNeeded: Address[] = await Promise.all(
      uniqueAddresses.map((address) =>
        getAllowance(address, userWallet!.address, ROUTER_ADDRESS).then(
          (allowance) => (allowance === '0' ? address : '')
        )
      )
    ).then((addresses) => addresses.filter((address) => address !== ''));

    for (const address of approvalsNeeded) {
      const contractInterface = new ethers.Interface(I_ERC20_ABI);
      const data = contractInterface.encodeFunctionData('approve', [
        ROUTER_ADDRESS,
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      ]);
      await sendTransaction({
        from: userWallet!.address,
        to: address,
        gasLimit: '100000',
        value: '0',
        data,
      });
    }

    const contractInterface = new ethers.Interface(I_ROUTER_ABI);
    const data = contractInterface.encodeFunctionData(
      swapMetadata.tradeType === TradeType.EXACT_INPUT
        ? 'exactInput'
        : 'exactOutput',
      [
        swapMetadata.tradeType === TradeType.EXACT_INPUT
          ? {
              path: constructPath(hops),
              recipient: userWallet!.address,
              amountIn: inputValuePair[InputType.BASE],
              amountOutMinimum: '1',
            }
          : {
              path: constructPath(hops),
              recipient: userWallet!.address,
              amountOut: inputValuePair[InputType.QUOTE],
              amountInMaximum: '1',
            },
      ]
    );

    await sendTransaction({
      from: userWallet!.address,
      to: ROUTER_ADDRESS,
      gasLimit: (Number(staticSwapResult!.gasUseEstimate) * 2).toString(),
      value: '0',
      data,
    });

    setLoading(false);
  };

  console.log(transactionResponse);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg w-2xl w-2xl mx-auto shadow-lg flex flex-col gap-6">
      <FaCog className="text-gray-400 cursor-pointer ml-auto" />

      <hr className="border-gray-700" />

      <TokenInput input={InputType.BASE} />

      <div className="flex justify-center items-center">
        <FaExchangeAlt
          className="text-gray-400 cursor-pointer transform rotate-90"
          onClick={handleFlipOrder}
        />
      </div>

      <TokenInput input={InputType.QUOTE} />

      <SwapMetadata />

      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        disabled={loading}
        onClick={userWallet ? executeSwap : login}
      >
        {userWallet ? 'Swap' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default Swap;
