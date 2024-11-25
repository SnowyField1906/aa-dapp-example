import { TradeType } from '@uniswap/sdk-core'
import {
    InputType,
    OnchainToken,
    Pair,
    ParsedRoute,
    PoolIdentifier,
    UniswapStaticHop,
    UniswapStaticRoute,
    UniswapStaticSwapRequest,
    UniswapStaticSwapResponse,
} from '@utils/types'
import { parseOnChainToken, truncateDecimals } from './tokens'
import { solidityPacked } from 'ethers'

export const formatFee = (fee: number): string => {
    return truncateDecimals(`${fee / 10000}`, 2) + '%'
}

export const constructPath = (route: UniswapStaticRoute, tradeType: TradeType): string => {
    if (tradeType === TradeType.EXACT_INPUT) {
        const packTypes = ['address']
        const packValues = [route[0].tokenIn.address]

        for (const { fee, tokenOut } of route) {
            packTypes.push('uint24', 'address')
            packValues.push(fee, tokenOut.address)
        }

        return solidityPacked(packTypes, packValues)
    } else {
        const packTypes = ['address']
        const packValues = [route[route.length - 1].tokenOut.address]

        for (const { fee, tokenIn } of route.slice().reverse()) {
            packTypes.push('uint24', 'address')
            packValues.push(fee, tokenIn.address)
        }

        return solidityPacked(packTypes, packValues)
    }
}

export const parseRoute = (routeString: string, routes: UniswapStaticRoute[]): ParsedRoute[] => {
    const poolMap = new Map<string, UniswapStaticHop>()
    routes.forEach((route) =>
        route.forEach((pool) => pool.address && poolMap.set(pool.address.toLowerCase(), pool))
    )

    const parsedRoutes: ParsedRoute[] = routeString.split(', ').map((route) => {
        const trimmedRoute = route.trim()
        const percentageMatch = trimmedRoute.match(/\[V3\]\s*([\d.]+)%\s*=/)
        const percentage = percentageMatch ? Number(percentageMatch[1]) : 0
        const addressMatches = trimmedRoute.match(/\[0x[a-fA-F0-9]+\]/g)
        const addresses = addressMatches
            ? addressMatches.map((addr) => addr.replace(/[\[\]]/g, '').toLowerCase())
            : []

        const parsedHops: PoolIdentifier[] = addresses.map((address) => {
            const pool = poolMap.get(address)
            if (!pool) throw new Error(`Pool not found for address: ${address}`)
            return {
                tokenA: parseOnChainToken(pool.tokenIn),
                tokenB: parseOnChainToken(pool.tokenOut),
                fee: Number(pool.fee),
            }
        })

        return { percentage, hops: parsedHops } as ParsedRoute
    })

    return parsedRoutes
}

export const staticSwap = async (
    tokenPair: Pair<OnchainToken>,
    valuePair: Pair<string | null>,
    tradeType: TradeType,
    minSplits: number,
    maxSplits: number
): Promise<UniswapStaticSwapResponse> => {
    const searchParams: UniswapStaticSwapRequest = {
        protocols: 'v2,v3,mixed',
        tokenInAddress: tokenPair[InputType.BASE].address,
        tokenInChainId: tokenPair[InputType.BASE].chainId,
        tokenOutAddress: tokenPair[InputType.QUOTE].address,
        tokenOutChainId: tokenPair[InputType.QUOTE].chainId,
        type: tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
        amount: valuePair[
            tradeType === TradeType.EXACT_INPUT ? InputType.BASE : InputType.QUOTE
        ]!.toString(),
        minSplits,
        maxSplits,
    }

    const response = await fetch(
        `https://api.uniswap.org/v1/quote?${new URLSearchParams(searchParams as any)}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    )
    const data = await response.json()
    return data
}
