'use client';

import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { InputType, OffChainToken, Pair } from '@utils/types';
import {
  certificatedLogoUri,
  parseReadableAmount,
  parseTokenValue,
} from '@utils/offchain/tokens';
import { getBalance } from '@utils/onchain/token';
import { useWalletContext } from '@aawallet-sdk';

const TokenInput = ({
  tokenList,
  selectedTokenPair,
  setSelectedTokenPair,
  inputValuePair,
  setInputValuePair,
  inputType,
}: {
  tokenList: OffChainToken[];
  selectedTokenPair: Pair<OffChainToken | null>;
  setSelectedTokenPair: Dispatch<SetStateAction<Pair<OffChainToken | null>>>;
  inputValuePair: Pair<string | null>;
  setInputValuePair: Dispatch<SetStateAction<Pair<string | null>>>;
  inputType: InputType;
}) => {
  const { userWallet } = useWalletContext();

  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<string>('');
  const [balance, setBalance] = useState<string>('');

  const handleTokenChange = (selected: OffChainToken) => {
    const token = tokenList.find((t) => t.symbol === selected.symbol);
    setSelectedTokenPair({ ...selectedTokenPair, [inputType]: token });
    setDropdownOpen(false);
  };
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBlurAmount(e.target.value);
  };
  const handleUpdateValue = () => {
    if (blurAmount) {
      let value = parseTokenValue(
        blurAmount,
        selectedTokenPair[inputType]!.decimals
      );
      setInputValuePair((prev) => ({ ...prev, [inputType]: value }));
    } else {
      setInputValuePair((prev) => ({ ...prev, [inputType]: null }));
      setBlurAmount('');
    }
  };

  useEffect(() => {
    (async () => {
      if (inputValuePair[inputType] && selectedTokenPair[inputType]) {
        let readableAmount = parseReadableAmount(
          inputValuePair[inputType],
          selectedTokenPair[inputType].decimals
        );
        setBlurAmount(readableAmount);
      } else {
        setBlurAmount('');
      }

      if (userWallet && selectedTokenPair[inputType]) {
        let balance = await getBalance(
          selectedTokenPair[inputType].address,
          userWallet.address
        );
        setBalance(balance);
      }
    })();
  }, [inputValuePair[inputType], selectedTokenPair[inputType], userWallet]);

  return (
    <div className="bg-gray-950 p-3 rounded-lg shadow-md select-none">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{inputType}</span>
        <span className="text-gray-400 text-xs cursor-pointer">
          Balance: {balance === '' ? '...' : balance}
        </span>
      </div>

      <div className="flex items-center rounded-lg mb-2">
        <div
          className="flex items-center justify-between cursor-pointer p-3 rounded-lg mr-4 bg-gray-900"
          onClick={() => setDropdownOpen(!isDropdownOpen)}
        >
          {selectedTokenPair[inputType] ? (
            <>
              <img
                src={certificatedLogoUri(selectedTokenPair[inputType].logoURI)}
                alt={selectedTokenPair[inputType].symbol}
                className="w-6 h-6 mr-2"
              />
              <span className="text-sm font-medium">
                {selectedTokenPair[inputType].symbol}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-400">
              Choose token
            </span>
          )}
          <span className="ml-2 text-gray-400">▼</span>
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={selectedTokenPair[inputType] ? blurAmount : 'select token'}
            disabled={!selectedTokenPair[inputType]}
            onChange={handleAmountChange}
            onBlur={handleUpdateValue}
            placeholder={selectedTokenPair[inputType] ? '0.00' : 'select token'}
            className="bg-transparent text-2xl text-right w-full focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="text-right text-gray-400 text-xs">${'usdValue'}</div>
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
                className="w-6 h-6 mr-2"
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
