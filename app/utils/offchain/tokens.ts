import { CHAIN_ID } from '../constants';
import { OffChainToken } from '../types';

export const getTokenList = async (
  chainId: number = CHAIN_ID
): Promise<OffChainToken[]> => {
  const response = await fetch('https://ipfs.io/ipns/tokens.uniswap.org');
  const tokenList = await response.json();
  return tokenList.tokens.filter(
    (token: OffChainToken) => token.chainId === chainId
  );
};
