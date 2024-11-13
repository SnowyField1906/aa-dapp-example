'use client';

import { computePoolAddress, Pool } from '@uniswap/v3-sdk';
import { TradeType, Percent } from '@uniswap/sdk-core';

import { CHAIN_ID, FACTORY_ADDRESS, I_POOL_ABI, PROVIDER } from '../constants';
import {
  Address,
  InputType,
  OnchainToken,
  Pair,
  PoolIdentifier,
} from '../types';
import { Contract } from 'ethers';
import {
  AlphaRouter,
  CurrencyAmount,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
} from '@uniswap/smart-order-router';
export const getPoolList = async (): Promise<PoolIdentifier[]> => {
  return [];
};

export const getPoolInfo = async (params: PoolIdentifier): Promise<Pool> => {
  let poolAddress = computePoolAddress({
    ...params,
    factoryAddress: FACTORY_ADDRESS,
  });
  let poolContract = new Contract(poolAddress, I_POOL_ABI.abi, PROVIDER);

  const [liquidity, slot0] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return new Pool(
    params.tokenA,
    params.tokenB,
    params.fee,
    slot0[0].toString(),
    liquidity.toString(),
    slot0[1]
  );
};

export const generateRoute = (
  tokenPair: Pair<OnchainToken>,
  valuePair: Pair<bigint | null>,
  recipient: Address,
  tradeType: TradeType
): Promise<SwapRoute | null> => {
  switch (tradeType) {
    case TradeType.EXACT_INPUT:
      return _generateRouterExactInput(tokenPair, valuePair, recipient);
    case TradeType.EXACT_OUTPUT:
      return _generateRouterExactOutput(tokenPair, valuePair, recipient);
  }
};

const _generateRouterExactInput = async (
  tokenPair: Pair<OnchainToken>,
  valuePair: Pair<bigint | null>,
  recipient: Address
): Promise<SwapRoute | null> => {
  const router = new AlphaRouter({
    chainId: CHAIN_ID,
    provider: PROVIDER,
  });

  const options: SwapOptionsSwapRouter02 = {
    recipient,
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      tokenPair[InputType.BASE],
      valuePair[InputType.BASE]!.toString()
    ),
    tokenPair[InputType.QUOTE],
    TradeType.EXACT_INPUT,
    options
  );

  return route;
};

const _generateRouterExactOutput = async (
  tokenPair: Pair<OnchainToken>,
  valuePair: Pair<bigint | null>,
  recipient: Address
): Promise<SwapRoute | null> => {
  const router = new AlphaRouter({
    chainId: CHAIN_ID,
    provider: PROVIDER,
  });

  const options: SwapOptionsSwapRouter02 = {
    recipient,
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      tokenPair[InputType.QUOTE],
      valuePair[InputType.QUOTE]!.toString()
    ),
    tokenPair[InputType.BASE],
    TradeType.EXACT_OUTPUT,
    options
  );

  return route;
};
