import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getTokenFiatPrice,
  getTokenList,
  parseOnChainTokenPair,
  parseReadableAmount,
  parseTokenValue,
} from '@utils/offchain/tokens';
import {
  InputType,
  OffChainToken,
  Pair,
  PairOpt,
  UniswapStaticSwapResponse,
} from '@utils/types';
import { TradeType } from '@uniswap/sdk-core';
import { staticSwap } from '@utils/onchain/uniswap';
import {
  allEmpty,
  allFilled,
  oppositeOf,
  someFilled,
  unwrapPair,
} from '@utils/offchain/base';
import { getBalance } from '@utils/onchain/tokens';

const useStaticSwap = () => {
  const [tokenList, setTokenList] = useState<OffChainToken[]>([]);
  useEffect(() => {
    (async () => {
      const initialTokenList = await getTokenList();
      setTokenList(initialTokenList);
    })();
  }, []);

  const [selectedTokenPair, setSelectedTokenPair] = useState<
    PairOpt<OffChainToken>
  >({
    [InputType.BASE]: null,
    [InputType.QUOTE]: null,
  });
  const [balancePair, setBalancePair] = useState<Pair<string>>({
    [InputType.BASE]: '',
    [InputType.QUOTE]: '',
  });
  const [fiatPricePair, setFiatPricePair] = useState<Pair<string>>({
    [InputType.BASE]: '',
    [InputType.QUOTE]: '',
  });
  const [inputValuePair, setInputValuePair] = useState<Pair<string>>({
    [InputType.BASE]: '',
    [InputType.QUOTE]: '',
  });
  const [onSwapLoadingPair, setOnSwapLoadingPair] = useState<Pair<boolean>>({
    [InputType.BASE]: false,
    [InputType.QUOTE]: false,
  });
  const [staticSwapResult, setStaticSwapResult] =
    useState<UniswapStaticSwapResponse>();

  const getReadableAmount = (input: InputType): string => {
    try {
      let readableAmount = parseReadableAmount(
        inputValuePair[input],
        selectedTokenPair[input]!.decimals
      );
      return readableAmount;
    } catch {
      return '';
    }
  };

  const handleFlipOrder = useCallback(() => {
    if (allEmpty(selectedTokenPair)) {
      setSelectedTokenPair({
        [InputType.BASE]: selectedTokenPair[InputType.QUOTE],
        [InputType.QUOTE]: selectedTokenPair[InputType.BASE],
      });
      setFiatPricePair({
        [InputType.BASE]: fiatPricePair[InputType.QUOTE],
        [InputType.QUOTE]: fiatPricePair[InputType.BASE],
      });
      setBalancePair({
        [InputType.BASE]: balancePair[InputType.QUOTE],
        [InputType.QUOTE]: balancePair[InputType.BASE],
      });
      setInputValuePair({
        [InputType.BASE]: inputValuePair[InputType.QUOTE],
        [InputType.QUOTE]: inputValuePair[InputType.BASE],
      });
    }
  }, [selectedTokenPair, fiatPricePair, balancePair, inputValuePair]);

  const handleUpdateToken = (input: InputType, token: OffChainToken) => {
    setSelectedTokenPair((prev) => ({ ...prev, [input]: token }));
  };
  const handleUpdateBalance = async (input: InputType, address: string) => {
    try {
      let balance = await getBalance(
        selectedTokenPair[input]!.address,
        address
      );
      setBalancePair((prev) => ({ ...prev, [input]: balance }));
    } catch {
      setBalancePair((prev) => ({ ...prev, [input]: '' }));
    }
  };
  const handleUpdateFiatPrice = async (input: InputType, amount: string) => {
    try {
      let fiatPrice = await getTokenFiatPrice(
        selectedTokenPair[input]!.symbol,
        amount
      );
      setFiatPricePair((prev) => ({ ...prev, [input]: fiatPrice }));
    } catch {
      setFiatPricePair((prev) => ({ ...prev, [input]: '' }));
    }
  };
  const handleUpdateInputValue = (input: InputType, amount: string): string => {
    try {
      let value = parseTokenValue(amount, selectedTokenPair[input]!.decimals);
      let readableAmount = parseReadableAmount(
        value,
        selectedTokenPair[input]!.decimals
      );
      setInputValuePair((prev) => ({ ...prev, [input]: value }));
      return readableAmount;
    } catch {
      setInputValuePair((prev) => ({ ...prev, [input]: '' }));
      return '';
    }
  };

  const handleSwap = useCallback(
    async (tradeType: TradeType, updatedInput: InputType) => {
      const oppositeInput = oppositeOf(updatedInput);

      setOnSwapLoadingPair((prev) => ({ ...prev, [oppositeInput]: true }));

      const result = await staticSwap(
        parseOnChainTokenPair(unwrapPair(selectedTokenPair)),
        inputValuePair,
        tradeType
      );
      setStaticSwapResult(result);
      setInputValuePair((prev) => ({ ...prev, [oppositeInput]: result.quote }));

      setOnSwapLoadingPair((prev) => ({ ...prev, [oppositeInput]: false }));
    },
    [selectedTokenPair, inputValuePair]
  );

  const prevBaseInputValue = useRef(inputValuePair[InputType.BASE]);
  const prevQuoteInputValue = useRef(inputValuePair[InputType.QUOTE]);
  const baseSelectedToken = selectedTokenPair[InputType.BASE];
  const quoteSelectedToken = selectedTokenPair[InputType.QUOTE];
  const baseInputValue = inputValuePair[InputType.BASE];
  const quoteInputValue = inputValuePair[InputType.QUOTE];

  // Exact Input Swap: Call when [quoteSelectedToken, baseInputValue] changes
  useEffect(() => {
    let enoughData = allFilled(selectedTokenPair) && someFilled(inputValuePair);
    let isBaseChanged =
      prevBaseInputValue.current !== inputValuePair[InputType.BASE];

    if (enoughData && isBaseChanged) {
      handleSwap(TradeType.EXACT_INPUT, InputType.BASE);
      prevBaseInputValue.current = inputValuePair[InputType.BASE];
    }
  }, [quoteSelectedToken, baseInputValue]);

  // Exact Output Swap: Call when [baseSelectedToken, quoteInputValue] changes
  useEffect(() => {
    let enoughData = allFilled(selectedTokenPair) && someFilled(inputValuePair);
    let isQuoteChanged =
      prevQuoteInputValue.current !== inputValuePair[InputType.QUOTE];

    if (enoughData && isQuoteChanged) {
      handleSwap(TradeType.EXACT_OUTPUT, InputType.QUOTE);
      prevQuoteInputValue.current = inputValuePair[InputType.QUOTE];
    }
  }, [baseSelectedToken, quoteInputValue]);

  return {
    tokenList,
    getReadableAmount,
    selectedTokenPair,
    balancePair,
    fiatPricePair,
    inputValuePair,
    onSwapLoadingPair,
    handleUpdateToken,
    handleFlipOrder,
    handleUpdateBalance,
    handleUpdateFiatPrice,
    handleUpdateInputValue,
    staticSwapResult,
    handleSwap,
  };
};

export default useStaticSwap;
