'use client';

import { CHAIN_ID } from '../constants';
import { InputType, OffChainToken, OnchainToken, Pair } from '../types';
import { Token } from '@uniswap/sdk-core';

export const getTokenList = async (
  chainId: number = CHAIN_ID
): Promise<OffChainToken[]> => {
  const response = await fetch('https://ipfs.io/ipns/tokens.uniswap.org');
  const tokenList = await response.json();
  return tokenList.tokens.filter(
    (token: OffChainToken) => token.chainId === chainId
  );
};

export const parseOnChainToken = (t: OffChainToken): OnchainToken => {
  return new Token(t.chainId, t.address, t.decimals, t.symbol, t.name);
};
export const parseOnChainTokenPair = (
  pair: Pair<OffChainToken>
): Pair<OnchainToken> => {
  return {
    [InputType.BASE]: parseOnChainToken(pair[InputType.BASE]),
    [InputType.QUOTE]: parseOnChainToken(pair[InputType.QUOTE]),
  };
};

export const certificatedLogoUri = (uri: string): string => {
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
};

export const parseTokenValue = (amount: string, decimals: number): string => {
  const separator = amount.indexOf('.') !== -1 ? '.' : ',';
  const [integer, fraction] = amount.split(separator);
  const integerPart = BigInt(integer);
  const fractionPart = BigInt(fraction || '0');

  if (!fraction) {
    return (integerPart * BigInt(10 ** decimals)).toString();
  }

  if (fraction.length > decimals) {
    throw new Error('Too many decimal places');
  }

  const fractionMultiplier = BigInt(10 ** (decimals - fraction.length));
  return (
    integerPart * BigInt(10 ** decimals) +
    fractionPart * fractionMultiplier
  ).toString();
};

export const parseReadableAmount = (
  value: string,
  decimals: number
): string => {
  const integer = BigInt(value) / BigInt(10 ** decimals);
  const fraction = BigInt(value) % BigInt(10 ** decimals);

  if (fraction === BigInt(0)) {
    return integer.toString();
  }

  const trimmedFraction = fraction.toString().replace(/0+$/, '');
  const readableAmount = `${integer}.${trimmedFraction}`;
  return truncateDecimals(readableAmount, 6);
};

export const truncateDecimals = (
  readableAmount: string,
  decimals: number
): string => {
  const [integer, fraction] = readableAmount.split('.');
  if (!fraction) {
    return integer;
  }
  return `${integer}.${fraction.slice(0, decimals)}`;
};

export const getTokenFiatPrice = async (
  symbol: string,
  readableInputAmount: string
): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
    );
    let data = await response.json();
    let fiatPrice: string = data.data.amount;
    let total: number = parseFloat(readableInputAmount) * parseFloat(fiatPrice);
    return truncateDecimals(total.toString(), 6);
  } catch (error) {
    console.error('Error fetching price:', error);
    return '0';
  }
};
