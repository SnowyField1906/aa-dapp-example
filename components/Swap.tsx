'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { FaCog, FaExchangeAlt } from 'react-icons/fa';
import { InputType, OffChainToken, Pair } from '@utils/types';
import TokenInput from './TokenInput';
import { Pool } from '@uniswap/v3-sdk';
import {
  parseOnChainToken,
  parseOnChainTokenPair,
} from '@utils/offchain/tokens';
import { useWalletContext } from '@aawallet-sdk';
import { CurrencyAmount, SwapRoute } from '@uniswap/smart-order-router';
import { TradeType } from '@uniswap/sdk-core';
import { BASE_URL } from '@utils/constants';

const Swap = ({ tokenList }: { tokenList: OffChainToken[] }) => {
  const { userWallet } = useWalletContext();

  const [routeComputationLoading, setRouteComputationLoading] =
    useState<boolean>(false);
  const [selectedTokenPair, setSelectedTokenPair] = useState<
    Pair<OffChainToken | null>
  >({ [InputType.BASE]: null, [InputType.QUOTE]: null });
  const [inputValuePair, setInputValuePair] = useState<Pair<string | null>>({
    [InputType.BASE]: null,
    [InputType.QUOTE]: null,
  });

  const tokenPairFilled =
    selectedTokenPair[InputType.BASE] &&
    selectedTokenPair[InputType.QUOTE] &&
    (inputValuePair[InputType.BASE] !== null ||
      inputValuePair[InputType.QUOTE] !== null);

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
  console.log({ tokenPairFilled, routeComputationLoading });
  useEffect(() => {
    (async () => {
      console.log('Exact Input Swap');
      if (tokenPairFilled && !routeComputationLoading) {
        console.log('Start Exact Input Swap');
        setRouteComputationLoading(true);
        const res = await fetch(`${BASE_URL}/api/uniswap-route`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenPair: selectedTokenPair,
            valuePair: inputValuePair,
            recipient: userWallet!.address,
            tradeType: TradeType.EXACT_INPUT,
          }),
        });
        const route: SwapRoute = await res.json();
        console.log('Exact Input Swap Route: ', route);

        setInputValuePair((prev) => ({
          ...prev,
          [InputType.QUOTE]: route!.quote.toExact(),
        }));
        setRouteComputationLoading(false);
      }
    })();
  }, [selectedTokenPair[InputType.QUOTE], inputValuePair[InputType.BASE]]);

  // Exact Output Swap: Call when [baseSelectedToken, quoteInputValue] changes
  useEffect(() => {
    (async () => {
      console.log('Exact Output Swap');
      if (tokenPairFilled && !routeComputationLoading) {
        console.log('Start Exact Output Swap');
        setRouteComputationLoading(true);
        const res = await fetch(`${BASE_URL}/api/uniswap-route`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenPair: selectedTokenPair,
            valuePair: inputValuePair,
            recipient: userWallet!.address,
            tradeType: TradeType.EXACT_OUTPUT,
          }),
        });
        const route: SwapRoute = await res.json();
        console.log('Exact Output Swap Route: ', route);

        setInputValuePair((prev) => ({
          ...prev,
          [InputType.BASE]: route!.quote.toExact(),
        }));
        setRouteComputationLoading(false);
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
          <span className="text-white">
            3.6198 {selectedTokenPair[InputType.BASE]?.symbol} per{' '}
            {selectedTokenPair[InputType.QUOTE]?.symbol}
          </span>
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
