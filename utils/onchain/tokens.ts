'use client';

import { Contract, ethers } from 'ethers';
import { Address } from '../types';
import { I_ERC20_ABI, PROVIDER } from '../constants';

export const getBalance = async (
  tokenAddress: Address,
  ownerAddress: Address
): Promise<string> => {
  const contract = new ethers.Contract(tokenAddress, I_ERC20_ABI, PROVIDER);
  const balance = await contract.balanceOf(ownerAddress);
  return balance.toString();
};

export const getAllowance = async (
  tokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address
): Promise<string> => {
  const contract = new ethers.Contract(tokenAddress, I_ERC20_ABI, PROVIDER);
  const allowance = await contract.allowance(ownerAddress, spenderAddress);
  return allowance.toString();
};

export const getErc20 = async (address: Address) => {
  return new Contract(address, I_ERC20_ABI, PROVIDER);
};
