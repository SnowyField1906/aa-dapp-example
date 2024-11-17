import { NextRequest, NextResponse } from 'next/server'

import { Percent, TradeType } from '@uniswap/sdk-core'

import { CHAIN_ID, PROVIDER } from '@/utils/constants'

// export const POST = async (req: NextRequest) => {
//   const { tokenPair, valuePair, recipient, tradeType } = await req.json();

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
//       let exactInputRoute = await generateRouterExactInput(
//         tokenPair,
//         valuePair,
//         router,
//         options
//       );
//       return NextResponse.json(exactInputRoute);
//     case TradeType.EXACT_OUTPUT:
//       let exactOutputRoute = await generateRouterExactOutput(
//         tokenPair,
//         valuePair,
//         router,
//         options
//       );
//       return NextResponse.json(exactOutputRoute);
//   }
// };
