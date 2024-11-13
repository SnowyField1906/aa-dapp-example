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
  AlphaRouterParams,
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

export const generateRouterExactInput = async (
  tokenPair: Pair<OnchainToken>,
  valuePair: Pair<bigint | null>,
  router: AlphaRouter,
  options: SwapOptionsSwapRouter02
): Promise<SwapRoute | null> => {
  return router.route(
    CurrencyAmount.fromRawAmount(
      tokenPair[InputType.BASE],
      valuePair[InputType.BASE]!.toString()
    ),
    tokenPair[InputType.QUOTE],
    TradeType.EXACT_INPUT,
    options
  );
};

export const generateRouterExactOutput = async (
  tokenPair: Pair<OnchainToken>,
  valuePair: Pair<bigint | null>,
  router: AlphaRouter,
  options: SwapOptionsSwapRouter02
): Promise<SwapRoute | null> => {
  return router.route(
    CurrencyAmount.fromRawAmount(
      tokenPair[InputType.QUOTE],
      valuePair[InputType.QUOTE]!.toString()
    ),
    tokenPair[InputType.BASE],
    TradeType.EXACT_OUTPUT,
    options
  );
};
