import { Token } from '@uniswap/sdk-core';
import { computePoolAddress } from '@uniswap/v3-sdk';
import { FACTORY_ADDRESS, I_POOL_ABI, PROVIDER } from '../constants';
import { Address, OffChainToken } from '../types';
import { Contract } from 'ethers';

export const getPoolAddress = (
  t0: OffChainToken,
  t1: OffChainToken,
  fee: number
): string => {
  return computePoolAddress({
    factoryAddress: FACTORY_ADDRESS,
    tokenA: new Token(t0.chainId, t0.address, t0.decimals, t0.symbol, t0.name),
    tokenB: new Token(t1.chainId, t1.address, t1.decimals, t1.symbol, t1.name),
    fee,
  });
};

export const getPoolContract = (poolAddress: Address): Contract => {
  return new Contract(poolAddress, I_POOL_ABI.abi, PROVIDER);
};
