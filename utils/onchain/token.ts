'use client';

import { ethers } from 'ethers';
import { Address } from '../types';
import { PROVIDER } from '../constants';

export const getBalance = async (
  tokenAddress: Address,
  userAddress: Address
): Promise<string> => {
  const contract = new ethers.Contract(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)'],
    PROVIDER
  );
  const balance = await contract.balanceOf(userAddress);
  return balance.toString();
};
