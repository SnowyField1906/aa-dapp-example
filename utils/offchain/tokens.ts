'use client'

import { CHAIN_ID } from '../constants'
import { InputType, OffChainToken, OnchainToken, Pair, PairOpt, UniswapStaticToken } from '../types'
import { Token } from '@uniswap/sdk-core'
import defaultTokenList from '@uniswap/default-token-list'
import additionalTokenList from './additional_token_list.json'

export const getTokenList = async (chainId: number = CHAIN_ID): Promise<OffChainToken[]> => {
    /// alternative approach (suggested)
    /// const response = await fetch('https://ipfs.io/ipns/tokens.uniswap.org');
    /// const tokenList = await response.json();

    /// filter tokens by chainId
    const filtered = defaultTokenList.tokens.filter((token) => token.chainId === chainId)

    /// add native token to the list by modifying the wrapped token
    const wrappedToken = filtered.find((token) => token.symbol === 'WETH')
    const nativeToken = { ...wrappedToken, symbol: 'ETH' } as OffChainToken

    return [nativeToken, ...filtered, ...additionalTokenList]
}

export const parseOnChainToken = (t: OffChainToken | UniswapStaticToken): OnchainToken => {
    return new Token(t.chainId, t.address, Number(t.decimals), t.symbol, (t as any)?.name ?? '')
}
export const parseOnChainTokenPair = (pair: Pair<OffChainToken>): Pair<OnchainToken> => {
    return {
        [InputType.BASE]: parseOnChainToken(pair[InputType.BASE]),
        [InputType.QUOTE]: parseOnChainToken(pair[InputType.QUOTE]),
    }
}

export const isNativeToken = (token: OffChainToken): boolean => {
    return token.symbol === 'ETH'
}

export const certificatedLogoUri = (uri: string): string => {
    if (uri.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${uri.slice(7)}`
    }
    return uri
}

export const parseTokenValue = (amount: string, decimals: number): string => {
    if (amount === '') throw new Error('Empty value')

    const separator = amount.indexOf('.') !== -1 ? '.' : ','
    let [integer, fraction] = amount.split(separator)
    const integerPart = BigInt(integer)

    if (!fraction) {
        return (integerPart * BigInt(10 ** decimals)).toString()
    }
    if (fraction.length > decimals) {
        fraction = fraction.slice(0, decimals)
    }

    const fractionPart = BigInt(fraction)
    const fractionMultiplier = BigInt(10 ** (decimals - fraction.length))
    return (integerPart * BigInt(10 ** decimals) + fractionPart * fractionMultiplier).toString()
}
export const parseReadableAmount = (value: string, decimals: number, truncate = 6): string => {
    if (value === '') throw new Error('Empty value')

    const integer = BigInt(value) / BigInt(10 ** decimals)
    const fraction = BigInt(value) % BigInt(10 ** decimals)

    if (fraction === BigInt(0)) {
        return integer.toString()
    }

    const fractionString = fraction.toString()
    const padStarts = decimals - fractionString.length
    const trimmedFraction = fractionString.replace(/0+$/, '')
    const paddedFraction = '0'.repeat(padStarts) + trimmedFraction
    const truncatedFraction = paddedFraction.slice(0, truncate)

    return `${integer}.${truncatedFraction}`
}

export const truncateDecimals = (readableAmount: string, decimals: number): string => {
    const [integer, fraction] = readableAmount.split('.')
    if (!fraction || fraction.slice(0, decimals) === '') {
        return integer
    }

    const truncatedFraction = fraction.slice(0, decimals)
    const trimmedFraction = truncatedFraction.replace(/0+$/, '')
    if (trimmedFraction === '') {
        return integer
    }

    return `${integer}.${trimmedFraction}`
}

export const getTokenFiatPrice = async (
    symbol: string,
    readableInputAmount: string
): Promise<string> => {
    try {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`)
        const data = await response.json()
        const fiatPrice: string = data.data.amount
        const total: number = parseFloat(readableInputAmount) * parseFloat(fiatPrice)
        return truncateDecimals(total.toString(), 6)
    } catch (error) {
        console.error('Error fetching price:', error)
        return '0'
    }
}

export const computeMinReceived = (amountOut: string, slippage: number): string => {
    return (BigInt(amountOut) - (BigInt(amountOut) * BigInt(slippage)) / BigInt(100)).toString()
}

export const computeMaxSpent = (amountIn: string, slippage: number): string => {
    return (BigInt(amountIn) + (BigInt(amountIn) * BigInt(slippage)) / BigInt(100)).toString()
}

export const computeMinReceivedFloat = (amountOut: string, slippage: number): string => {
    return (parseFloat(amountOut) - parseFloat(amountOut) * (slippage / 100)).toString()
}

export const computeMaxSpentFloat = (amountIn: string, slippage: number): string => {
    return (parseFloat(amountIn) + parseFloat(amountIn) * (slippage / 100)).toString()
}
