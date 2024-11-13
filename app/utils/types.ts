export type Address = string;

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
