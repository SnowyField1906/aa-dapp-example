import { Token, TradeType } from '@uniswap/sdk-core';

export type Address = string;

export type OnchainToken = Token;
export type OffChainToken = {
  chainId: number;
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  extensions?: {
    bridgeInfo?: {
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
export type PairOpt<T> = Pair<T | null>;

export type PoolIdentifier = {
  tokenA: OnchainToken;
  tokenB: OnchainToken;
  fee: number;
};

export enum InputType {
  BASE = 'Pay',
  QUOTE = 'Receive',
}

export type SwapConfigs = {
  slippage: number;
  gasBuffer: number;
};
export type SwapMetadata = {
  minimumReceived: string;
  maximumSpent: string;
  gasToPay: string;
  gweiFee: string;
  bestPrice: string;
  tradeType: TradeType;
};

/* Uniswap V3 APIs */

export type UniswapStaticToken = {
  chainId: number;
  address: Address;
  decimals: string;
  symbol: string;
};
export type UniswapStaticRoute = {
  type: 'v3-pool';
  address: Address;
  tokenIn: UniswapStaticToken;
  tokenOut: UniswapStaticToken;
  fee: string;
  liquidity: string;
  sqrtRatioX96: string;
  tickCurrent: string;
  amountIn: string;
  amountOut: string;
};
export type ParsedRoute = {
  percentage: number;
  hops: PoolIdentifier[];
};

export type UniswapStaticSwapRequest = {
  protocols: 'v2,v3,mixed';
  tokenInAddress: Address;
  tokenInChainId: number;
  tokenOutAddress: Address;
  tokenOutChainId: number;
  amount: string;
  type: 'exactIn' | 'exactOut';
};
export type UniswapStaticSwapResponse = {
  blockNumber: string;
  amount: string;
  amountDecimals: string;
  quote: string;
  quoteDecimals: string;
  quoteGasAdjusted: string;
  quoteGasAdjustedDecimals: string;
  gasUseEstimateQuote: string;
  gasUseEstimateQuoteDecimals: string;
  gasUseEstimate: string;
  gasUseEstimateUSD: string;
  simulationStatus: string;
  simulationError: boolean;
  gasPriceWei: string;
  route: UniswapStaticRoute[][];
  routeString: string;
  quoteId: string;
  hitsCachedRoutes: boolean;
  priceImpact: string;
};
