import { JsonRpcProvider } from 'ethers';
import { Address } from './types';
const url = 'https://eth-sepolia.api.onfinality.io/public';

export const PROVIDER = new JsonRpcProvider(
  'https://eth-sepolia.api.onfinality.io/public'
);
export const CHAIN_ID = 11155111;
export const ROUTER_ADDRESS: Address =
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
export const FACTORY_ADDRESS: Address =
  '0x0227628f3F023bb0B980b67D528571c95c6DaC1c';
export { default as I_POOL_ABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
