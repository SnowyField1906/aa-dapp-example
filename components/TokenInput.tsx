'use client';

import { useEffect, useState } from 'react';
import { InputType, OffChainToken, Pair } from '@utils/types';
import {
  certificatedLogoUri,
  parseReadableAmount,
} from '@utils/offchain/tokens';
import { useWalletContext } from '@aawallet-sdk';
import { useStaticSwapContext } from '@providers/StaticSwapProvider';

const TokenInput = ({ input }: { input: InputType }) => {
  const { userWallet } = useWalletContext();
  const {
    tokenList,
    getReadableAmount,
    selectedTokenPair,
    balancePair,
    fiatPricePair,
    inputValuePair,
    onSwapLoadingPair,
    handleUpdateToken,
    handleUpdateBalance,
    handleUpdateFiatPrice,
    handleUpdateInputValue,
  } = useStaticSwapContext();

  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [tempAmount, setTempAmount] = useState<string>('');

  const handleTokenChange = (selected: OffChainToken) => {
    handleUpdateToken(input, selected);
    setDropdownOpen(false);
  };
  const handleOnBlur = () => {
    handleUpdateInputValue(input, tempAmount);
  };

  useEffect(() => {
    let readableAmount = getReadableAmount(input);
    setTempAmount(readableAmount);

    Promise.all([
      readableAmount && handleUpdateFiatPrice(input, readableAmount),
      userWallet && handleUpdateBalance(input, userWallet.address),
    ]);
  }, [inputValuePair[input], selectedTokenPair[input], userWallet]);

  return (
    <div className="bg-gray-950 p-3 rounded-lg shadow-md select-none w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{input}</span>
        <span className="text-gray-400 text-xs cursor-pointer">
          Balance:{' '}
          {balancePair[input]
            ? parseReadableAmount(
                balancePair[input],
                selectedTokenPair[input]!.decimals
              )
            : '..'}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-lg mb-2 w-full">
        <div
          className="flex items-center justify-between cursor-pointer p-3 rounded-lg mr-4 bg-gray-900"
          onClick={() => setDropdownOpen(!isDropdownOpen)}
        >
          {selectedTokenPair[input] ? (
            <>
              <img
                src={certificatedLogoUri(selectedTokenPair[input].logoURI)}
                alt={selectedTokenPair[input].symbol}
                className="w-6 h-6 mr-2 rounded-full"
              />
              <span className="text-sm font-medium">
                {selectedTokenPair[input].symbol}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-400">
              Choose token
            </span>
          )}
          <span className="ml-2 text-gray-400">▼</span>
        </div>

        <div className={onSwapLoadingPair[input] ? 'animate-pulse' : ''}>
          <input
            type="text"
            value={selectedTokenPair[input] ? tempAmount : 'select token'}
            disabled={!selectedTokenPair[input] || onSwapLoadingPair[input]}
            onChange={(e) => setTempAmount(e.target.value)}
            onBlur={handleOnBlur}
            placeholder={selectedTokenPair[input] ? '0.00' : 'select token'}
            className="bg-transparent text-2xl text-right w-full focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="text-right text-gray-400 text-xs">
            ${fiatPricePair[input]}
          </div>
        </div>
      </div>

      {isDropdownOpen && (
        <div className="absolute rounded-lg overflow-y-auto shadow-lg z-10 mt-1 bg-gray-900">
          {tokenList.map((token) => (
            <div
              key={token.address}
              className="flex items-center p-3 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleTokenChange(token)}
            >
              <img
                src={certificatedLogoUri(token.logoURI)}
                alt={token.symbol}
                className="w-6 h-6 mr-2 rounded-full"
              />
              <span className="text-sm font-medium">{token.symbol}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenInput;
