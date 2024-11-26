## AAWallet SDK

Source: [@aawallet-sdk](./aawallet-sdk/index.ts)

AAWallet SDK provides a Context Wrapper (Provider) for the application to interact to AAWallet with the following states and methods:

```ts
export interface WalletContext {
  userWallet: PublicUserWallet<EChain> | undefined;
  login: () => void;
  logout: () => void;
  sendTransaction: (payload: TransactionRequest<EChain>) => Promise<TransactionResponse<EChain>>
  waitTransaction: (hash: string) => Promise<TransactionReceipt<EChain>>
}
```

## Client Demo

- [x] Login + logout
- [x] Sign transaction
- [x] 4 swap strategies (i.e. `ExactInZeroForOne`, `ExactOutZeroForOne`, `ExactInOneForZero`, `ExactOutOneForZero`)
- [x] Multi hops swap
- [x] Multi routes swap
- [x] Handle all* wallets + transaction errors (e.g. transaction failures, signing failures, static swap failures)
- [x] Readable transaction revert messages
- [x] Settable configs (`slippage`, `gasBuffer`, `minSplits`, `maxSplits` and `maxSwapsPerPath`)

## Acknowledgements (*)

- (Fixed) Current Sepolia RPC is unsable, errors related to the RPC are remaining unhandled (e.g. delayed balances, transaction submission failure)
- (Fixed) Chaining transaction should be implemented. Otherwise there will be unexpected errors (e.g. approve tokens -> swap, multiple routes swap)
- Currently the amount of token to be approved is `uint256.max`. Keeping approving whenever the user swaps the same token is not a good practice to me

## Sample env

```env
NEXT_PUBLIC_TARGET_WALLET=http://localhost:3000/transaction_signing
```
