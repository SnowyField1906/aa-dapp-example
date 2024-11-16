import { computePoolAddress, Pool } from '@uniswap/v3-sdk';

import { FACTORY_ADDRESS, I_POOL_ABI, PROVIDER } from '../constants';
import { PoolIdentifier } from '../types';
import { Contract } from 'ethers';

export const getPoolList = async (): Promise<PoolIdentifier[]> => {
  return [];
};

export const getPoolAddress = (params: PoolIdentifier): string => {
  return computePoolAddress({
    ...params,
    factoryAddress: FACTORY_ADDRESS,
  });
};
export const getPoolInfo = async (params: PoolIdentifier): Promise<Pool> => {
  let poolAddress = getPoolAddress(params);
  let poolContract = new Contract(poolAddress, I_POOL_ABI, PROVIDER);

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

/*
 * Generate route by Uniswap V3 SDK (manual implementation)
 */

// export const generateRoute = async (
//   tokenList: OffChainToken[],
//   tokenPair: Pair<OnchainToken>,
//   valuePair: Pair<bigint | null>,
//   tradeType: TradeType
// ): Promise<
//   Route<(typeof tokenPair)[InputType.BASE], (typeof tokenPair)[InputType.QUOTE]>
// > => {
//   // Get all possible pool identifiers from tokenList
//   const tokenCombinations = getCombinations(tokenList, 2) as [
//     OffChainToken,
//     OffChainToken
//   ][];
//   const tokenAndFeeCombinations = tokenCombinations.flatMap((pair) =>
//     UNISWAP_FEES.map(
//       (fee) => [...pair, fee] as [OffChainToken, OffChainToken, number]
//     )
//   );
//   const allPossiblePoolIdentifiers: PoolIdentifier[] =
//     tokenAndFeeCombinations.map(([tokenA, tokenB, fee]) => ({
//       tokenA: parseOnChainToken(tokenA),
//       tokenB: parseOnChainToken(tokenB),
//       fee,
//     }));

//   const allPossiblePools: Pool[] = await Promise.all(
//     allPossiblePoolIdentifiers.map((poolIdentifier) =>
//       getPoolInfo(poolIdentifier)
//     )
//   );

//   return bestRoute!;
// };

/*
 * Generate route by SmartOrderRouter (cannot be used in client-side, server-side has some bugs in imports)
 */

// export const generateRoute = (
//   tokenPair: Pair<OnchainToken>,
//   valuePair: Pair<bigint | null>,
//   recipient: Address,
//   tradeType: TradeType
// ): Promise<SwapRoute | null> => {
//   const router = new AlphaRouter({
//     chainId: CHAIN_ID,
//     provider: PROVIDER,
//   });

//   const options: SwapOptionsSwapRouter02 = {
//     recipient,
//     slippageTolerance: new Percent(50, 10_000),
//     deadline: Math.floor(Date.now() / 1000 + 1800),
//     type: SwapType.SWAP_ROUTER_02,
//   };

//   switch (tradeType) {
//     case TradeType.EXACT_INPUT:
//       return generateRouterExactInput(tokenPair, valuePair, router, options);
//     case TradeType.EXACT_OUTPUT:
//       return generateRouterExactOutput(tokenPair, valuePair, router, options);
//   }
// };
// export const generateRouterExactInput = async (
//   tokenPair: Pair<OnchainToken>,
//   valuePair: Pair<bigint | null>,
//   router: AlphaRouter,
//   options: SwapOptionsSwapRouter02
// ): Promise<SwapRoute | null> => {
//   return router.route(
//     CurrencyAmount.fromRawAmount(
//       tokenPair[InputType.BASE],
//       valuePair[InputType.BASE]!.toString()
//     ),
//     tokenPair[InputType.QUOTE],
//     TradeType.EXACT_INPUT,
//     options
//   );
// };
// export const generateRouterExactOutput = async (
//   tokenPair: Pair<OnchainToken>,
//   valuePair: Pair<bigint | null>,
//   router: AlphaRouter,
//   options: SwapOptionsSwapRouter02
// ): Promise<SwapRoute | null> => {
//   return router.route(
//     CurrencyAmount.fromRawAmount(
//       tokenPair[InputType.QUOTE],
//       valuePair[InputType.QUOTE]!.toString()
//     ),
//     tokenPair[InputType.BASE],
//     TradeType.EXACT_OUTPUT,
//     options
//   );
// };
