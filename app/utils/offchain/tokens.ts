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

export const parseTokenValue = (amount: string, decimals: number): bigint => {
  const separator = amount.indexOf('.') !== -1 ? '.' : ',';
  const [integer, fraction] = amount.split(separator);
  const integerPart = BigInt(integer);
  const fractionPart = BigInt(fraction || '0');

  if (fraction.length > decimals) {
    throw new Error('Too many decimal places');
  }

  const fractionMultiplier = BigInt(10 ** (decimals - fraction.length));
  return (
    integerPart * BigInt(10 ** decimals) + fractionPart * fractionMultiplier
  );
};

export const parseReadableAmount = (
  value: bigint,
  decimals: number
): string => {
  const integer = value / BigInt(10 ** decimals);
  const fraction = value % BigInt(10 ** decimals);

  if (fraction === BigInt(0)) {
    return integer.toString();
  }

  const fractionStr = fraction.toString();
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  return `${integer}.${trimmedFraction}`;
};
