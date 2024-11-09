import { PublicKey } from '@solana/web3.js';

export const TARGET_WALLET = 'http://localhost:3000/transaction_signing';
export const SOLANA_RPC_URL = 'http://localhost:8899';
export const ETHEREUM_RPC_URL = 'http://localhost:8545';
export const ETHEREUM_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ETHEREUM_CONTRACT_ADDRESS!;
export const SOLANA_PROGRAM_ID = new PublicKey(
  '7ezV5kY1bu3mcHpZQUJWU5YJWGobyxe9RA6EJV9LJ5aL'
);

export const ETHEREUM_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'getPingCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ping',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'pingCounts',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
export const SOLANA_IDL = {
  address: '7ezV5kY1bu3mcHpZQUJWU5YJWGobyxe9RA6EJV9LJ5aL',
  metadata: {
    name: 'solana_counter',
    version: '0.1.0',
    spec: '0.1.0',
    description: 'Created with Anchor',
  },
  instructions: [
    {
      name: 'initialize',
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        {
          name: 'counter',
          writable: true,
          pda: {
            seeds: [
              {
                kind: 'const',
                value: [99, 111, 117, 110, 116, 101, 114],
              },
            ],
          },
        },
        {
          name: 'user',
          writable: true,
          signer: true,
        },
        {
          name: 'system_program',
          address: '11111111111111111111111111111111',
        },
      ],
      args: [],
    },
    {
      name: 'ping',
      discriminator: [173, 0, 94, 236, 73, 133, 225, 153],
      accounts: [
        {
          name: 'counter',
          writable: true,
          pda: {
            seeds: [
              {
                kind: 'const',
                value: [99, 111, 117, 110, 116, 101, 114],
              },
            ],
          },
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'Counter',
      discriminator: [255, 176, 4, 245, 188, 253, 124, 25],
    },
  ],
  types: [
    {
      name: 'Counter',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'count',
            type: 'u64',
          },
        ],
      },
    },
  ],
};
