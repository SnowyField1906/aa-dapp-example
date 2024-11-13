'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { FaCog, FaExchangeAlt } from 'react-icons/fa';
import { InputType, OffChainToken, Pair } from '../utils/types';
import TokenInput from './TokenInput';
import { Pool } from '@uniswap/v3-sdk';
import { generateRoute, getPoolInfo } from '../utils/onchain/uniswap';
import {
  parseOnChainToken,
  parseOnChainTokenPair,
} from '../utils/offchain/tokens';
import { useWalletContext } from '../@aawallet-sdk';
import { CurrencyAmount, SwapRoute } from '@uniswap/smart-order-router';
import { TradeType } from '@uniswap/sdk-core';

const Swap = ({ tokenList }: { tokenList: OffChainToken[] }) => {
  const { userWallet } = useWalletContext();

  const [routeComputationLoading, setRouteComputationLoading] =
    useState<boolean>(false);
  const [selectedTokenPair, setSelectedTokenPair] = useState<
    Pair<OffChainToken | null>
  >({ [InputType.BASE]: null, [InputType.QUOTE]: null });
  const [inputValuePair, setInputValuePair] = useState<Pair<bigint | null>>({
    [InputType.BASE]: null,
    [InputType.QUOTE]: null,
  });

  const tokenPairFilled =
    selectedTokenPair[InputType.BASE] && selectedTokenPair[InputType.QUOTE];

  const handleFlipOrder = () => {
    setSelectedTokenPair({
      [InputType.BASE]: selectedTokenPair[InputType.QUOTE],
      [InputType.QUOTE]: selectedTokenPair[InputType.BASE],
    });
    setInputValuePair({
      [InputType.BASE]: inputValuePair[InputType.QUOTE],
      [InputType.QUOTE]: inputValuePair[InputType.BASE],
    });
  };

  // Exact Input Swap: Call when [quoteSelectedToken, baseInputValue] changes
  useEffect(() => {
    (async () => {
      if (tokenPairFilled) {
        setRouteComputationLoading(true);
        const route: SwapRoute | null = await generateRoute(
          parseOnChainTokenPair(selectedTokenPair as Pair<OffChainToken>),
          inputValuePair,
          userWallet!.address,
          TradeType.EXACT_INPUT
        );
        console.log('Exact Input Swap Route: ', route);
        setInputValuePair({
          ...inputValuePair,
          [InputType.QUOTE]: BigInt(route!.quote.toExact()),
        });
      }
    })();
  }, [selectedTokenPair[InputType.QUOTE], inputValuePair[InputType.BASE]]);

  // Exact Output Swap: Call when [baseSelectedToken, quoteInputValue] changes
  useEffect(() => {
    (async () => {
      if (tokenPairFilled) {
        const route: SwapRoute | null = await generateRoute(
          parseOnChainTokenPair(selectedTokenPair as Pair<OffChainToken>),
          inputValuePair,
          userWallet!.address,
          TradeType.EXACT_OUTPUT
        );
        console.log('Exact Output Swap Route: ', route);
        setInputValuePair({
          ...inputValuePair,
          [InputType.BASE]: BigInt(route!.quote.toExact()),
        });
      }
    })();
  }, [selectedTokenPair[InputType.BASE], inputValuePair[InputType.QUOTE]]);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg w-2xl mx-auto shadow-lg flex flex-col gap-6">
      <FaCog className="text-gray-400 cursor-pointer ml-auto" />

      <hr className="border-gray-700" />

      <TokenInput
        tokenList={tokenList}
        selectedTokenPair={selectedTokenPair}
        setSelectedTokenPair={setSelectedTokenPair}
        inputValuePair={inputValuePair}
        setInputValuePair={setInputValuePair}
        inputType={InputType.BASE}
      />

      <div className="flex justify-center items-center">
        <FaExchangeAlt
          className="text-gray-400 cursor-pointer"
          onClick={handleFlipOrder}
        />
      </div>

      <TokenInput
        tokenList={tokenList}
        selectedTokenPair={selectedTokenPair}
        setSelectedTokenPair={setSelectedTokenPair}
        inputValuePair={inputValuePair}
        setInputValuePair={setInputValuePair}
        inputType={InputType.QUOTE}
      />

      <div className="bg-gray-800 p-4 rounded-lg text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Minimum Received</span>
          <span className="text-white">79.01222</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Rate</span>
          <span className="text-white">3.6198 BRWL per WAX</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Price Impact</span>
          <span className="text-white">0%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Slippage</span>
          <span className="text-white">0.1%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Liquidity Source Fee</span>
          <span className="text-white">0.3%</span>
        </div>
      </div>

      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
        SWAP
      </button>
    </div>
  );
};

export default Swap;
