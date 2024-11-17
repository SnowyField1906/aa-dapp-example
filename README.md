## Features

- [x] Login + logout
- [x] Sign transaction
- [x] 4 swap strategies (ExactInZeroForOne, ExactOutZeroForOne, ExactInOneForZero, ExactOutOneForZero)
- [x] Multi hops swap (one route only)
- [x] Handle all* wallets + transaction errors (transaction failures, signing failures, static swap failures)
- [x] Readable transaction revert messages
- [ ] Multi routes swap
- [ ] Settable configs (currently only `slippage` and `gasBuffer` are settable but UI is not implemented)

## Acknowledgements (*)

- Current Sepolia RPC is unsable, errors related to the RPC are remaining unhandled.
- Chaining transaction should be implemented. Otherwise there will be unexpected errors (e.g. approve tokens -> swap, multiple routes swap)

## Sample env

```env
TARGET_WALLET=http://localhost:3000/transaction_signing
```
