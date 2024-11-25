import { Token, TradeType } from '@uniswap/sdk-core'

export type Address = string

export type OnchainToken = Token
export type OffChainToken = {
    chainId: number
    address: Address
    name: string
    symbol: string
    decimals: number
    logoURI: string
    extensions?: {
        bridgeInfo?: {
            [chainId: string]: {
                tokenAddress: Address
            }
        }
    }
}

export type Pair<T> = {
    [InputType.BASE]: T
    [InputType.QUOTE]: T
}
export type PairOpt<T> = Pair<T | null>

export type PoolIdentifier = {
    tokenA: OnchainToken
    tokenB: OnchainToken
    fee: number
}

export enum InputType {
    BASE = 'Pay',
    QUOTE = 'Receive',
}

export type SwapConfigs = {
    slippage: number
    gasBuffer: number
    minSplits: number
    maxSplits: number
}
export type SwapMetadata = {
    minimumReceived: string
    maximumSpent: string
    gasToPay: string
    gweiFee: string
    bestPrice: string
    tradeType: TradeType
}

/* Uniswap V3 Types */

export type UniswapStaticToken = {
    chainId: number
    address: Address
    decimals: string
    symbol: string
}
export type UniswapStaticHop = {
    type: 'v3-pool'
    address: Address
    tokenIn: UniswapStaticToken
    tokenOut: UniswapStaticToken
    fee: string
    liquidity: string
    sqrtRatioX96: string
    tickCurrent: string
    amountIn: string
    amountOut: string
}
export type UniswapStaticRoute = UniswapStaticHop[]
export type ParsedRoute = {
    percentage: number
    hops: PoolIdentifier[]
}

/* Uniswap V3 API Interfaces */

export type UniswapStaticSwapRequest = {
    protocols: 'v2,v3,mixed'
    tokenInAddress: Address
    tokenInChainId: number
    tokenOutAddress: Address
    tokenOutChainId: number
    amount: string
    type: 'exactIn' | 'exactOut'
}
export type UniswapStaticSwapResponse = {
    blockNumber: string
    amount: string
    amountDecimals: string
    quote: string
    quoteDecimals: string
    quoteGasAdjusted: string
    quoteGasAdjustedDecimals: string
    gasUseEstimateQuote: string
    gasUseEstimateQuoteDecimals: string
    gasUseEstimate: string
    gasUseEstimateUSD: string
    simulationStatus: string
    simulationError: boolean
    gasPriceWei: string
    route: UniswapStaticRoute[]
    routeString: string
    quoteId: string
    hitsCachedRoutes: boolean
    priceImpact: string
}

/* Jupiter APIs */

export type JupiterStaticRoute = {
    ammKey: Address
    label?: string
    inputMint: Address
    outputMint: Address
    inAmount: string
    outAmount: string
    feeAmount: string
    feeMint: Address
}

export type JupiterStaticSwapRequest = {
    inputMint: Address
    outputMint: Address
    amount: string
    slippageBps?: number
    swapMode?: 'ExactIn' | 'ExactOut'
    dexes?: string[]
    excludeDexes?: string[]
    restrictIntermediateTokens?: boolean
    onlyDirectRoutes?: boolean
    asLegacyTransaction?: boolean
    platformFeeBps?: number
    maxAccounts?: number
    autoSlippage?: boolean
    maxAutoSlippageBps?: number
    autoSlippageCollisionUsdValue?: string
}

export type JupiterStaticSwapResponse = {
    inputMint: Address
    inAmount: string
    outputMint: Address
    outAmount: string
    otherAmountThreshold: string
    swapMode: 'ExactIn' | 'ExactOut'
    slippageBps: number
    platformFee?: {
        amount?: string
        feeBps?: number
    }
    priceImpactPct: string
    routePlan: {
        swapInfo: JupiterStaticRoute
        percent: number
    }[]
    contextSlot?: number
    timeTaken?: number
}
