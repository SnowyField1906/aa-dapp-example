import { Token } from '@uniswap/sdk-core';

export type Address = string;

export type OnchainToken = Token;
export type OffChainToken = {
  chainId: number;
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  extensions: {
    bridgeInfo: {
      [chainId: string]: {
        tokenAddress: Address;
      };
    };
  };
};

export type Pair<T> = {
  [InputType.BASE]: T;
  [InputType.QUOTE]: T;
};

export type PoolIdentifier = {
  tokenA: OnchainToken;
  tokenB: OnchainToken;
  fee: number;
};

export enum InputType {
  BASE = 'Pay',
  QUOTE = 'Receive',
}
