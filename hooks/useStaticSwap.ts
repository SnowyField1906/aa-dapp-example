import { useState, useEffect, useCallback, useRef } from 'react'
import {
    computeMaxSpent,
    computeMaxSpentFloat,
    computeMinReceivedFloat,
    getTokenFiatPrice,
    getTokenList,
    isNativeToken,
    parseOnChainTokenPair,
    parseReadableAmount,
    parseTokenValue,
} from '@utils/offchain/tokens'
import {
    InputType,
    OffChainToken,
    OnchainToken,
    Pair,
    PairOpt,
    SwapConfigs,
    SwapMetadata,
    UniswapStaticSwapResponse,
} from '@utils/types'
import { TradeType } from '@uniswap/sdk-core'
import { allFilled, oppositeOf, someFilled, unwrapPair } from '@utils/offchain/base'
import { getBalance, getNativeBalance } from '@utils/onchain/tokens'
import { staticSwap } from '@utils/offchain/uniswap'

const useStaticSwap = () => {
    const [tokenList, setTokenList] = useState<OffChainToken[]>([])
    const [selectedTokenPair, setSelectedTokenPair] = useState<PairOpt<OffChainToken>>({
        [InputType.BASE]: null,
        [InputType.QUOTE]: null,
    })
    const [balancePair, setBalancePair] = useState<Pair<string>>({
        [InputType.BASE]: '',
        [InputType.QUOTE]: '',
    })
    const [fiatPricePair, setFiatPricePair] = useState<Pair<string>>({
        [InputType.BASE]: '',
        [InputType.QUOTE]: '',
    })
    const [inputValuePair, setInputValuePair] = useState<Pair<string>>({
        [InputType.BASE]: '',
        [InputType.QUOTE]: '',
    })
    const [onSwapLoadingPair, setOnSwapLoadingPair] = useState<Pair<boolean>>({
        [InputType.BASE]: false,
        [InputType.QUOTE]: false,
    })
    const [activeInput, setActiveInput] = useState<InputType>()
    const [staticSwapResult, setStaticSwapResult] = useState<UniswapStaticSwapResponse>()
    const [swapConfigs, setSwapConfigs] = useState<SwapConfigs>({
        slippage: 10, // 10% slippage tolerance
        gasBuffer: 100, // 100% gas buffer
        minSplits: 1, // minimum path/route
        maxSplits: 3, // maximum path/route
        maxSwapsPerPath: 3, // maximum swaps per path/route
    })
    const [swapMetadata, setSwapMetadata] = useState<SwapMetadata>({
        minimumReceived: '',
        maximumSpent: '',
        gasToPay: '',
        ethFee: '',
        usdFee: '',
        bestPrice: '',
        tradeType: TradeType.EXACT_INPUT,
    })

    const prevActiveInput = useRef<InputType>()

    useEffect(() => {
        ;(async () => {
            const initialTokenList = await getTokenList()
            setTokenList(initialTokenList)
        })()
    }, [])

    const parseOffChainToken = (token: OnchainToken): OffChainToken => {
        return {
            chainId: token.chainId,
            address: token.address,
            decimals: token.decimals,
            symbol: token.symbol!,
            name: token.name!,
            logoURI: tokenList.find((t) => t.symbol === token.symbol)?.logoURI ?? '',
        }
    }
    const getReadableAmount = (input: InputType): string => {
        try {
            const readableAmount = parseReadableAmount(
                inputValuePair[input],
                selectedTokenPair[input]!.decimals
            )
            return readableAmount
        } catch {
            return ''
        }
    }

    const handleFlipOrder = useCallback(() => {
        if (someFilled(selectedTokenPair)) {
            setSelectedTokenPair({
                [InputType.BASE]: selectedTokenPair[InputType.QUOTE],
                [InputType.QUOTE]: selectedTokenPair[InputType.BASE],
            })
            setFiatPricePair({
                [InputType.BASE]: fiatPricePair[InputType.QUOTE],
                [InputType.QUOTE]: fiatPricePair[InputType.BASE],
            })
            setBalancePair({
                [InputType.BASE]: balancePair[InputType.QUOTE],
                [InputType.QUOTE]: balancePair[InputType.BASE],
            })
            setInputValuePair({
                [InputType.BASE]: inputValuePair[InputType.QUOTE],
                [InputType.QUOTE]: inputValuePair[InputType.BASE],
            })
            setActiveInput(InputType.BASE)
        }
    }, [selectedTokenPair, fiatPricePair, balancePair, inputValuePair])

    const handleUpdateToken = (input: InputType, token: OffChainToken) => {
        setSelectedTokenPair((prev) => ({ ...prev, [input]: token }))
        if (inputValuePair[oppositeOf(input)]) {
            setActiveInput(oppositeOf(input))
        }
    }
    const handleUpdateBalance = async (input: InputType, address: string) => {
        try {
            const r = isNativeToken(selectedTokenPair[input]!)
                ? await getNativeBalance(address)
                : await getBalance(selectedTokenPair[input]!.address, address)
            setBalancePair((prev) => ({ ...prev, [input]: r }))
        } catch {
            setBalancePair((prev) => ({ ...prev, [input]: '' }))
        }
    }
    const handleUpdateFiatPrice = async (input: InputType, amount: string) => {
        try {
            const r = await getTokenFiatPrice(selectedTokenPair[input]!.symbol, amount)
            setFiatPricePair((prev) => ({ ...prev, [input]: r }))
        } catch {
            setFiatPricePair((prev) => ({ ...prev, [input]: '' }))
        }
    }
    const handleUpdateInputValue = (input: InputType, amount: string) => {
        try {
            const r = parseTokenValue(amount, selectedTokenPair[input]!.decimals)
            setInputValuePair((prev) => ({ ...prev, [input]: r }))
            setActiveInput(input)
        } catch {
            setInputValuePair((prev) => ({ ...prev, [input]: '' }))
        }
    }

    const handleSwap = useCallback(
        async (tradeType: TradeType, updatedInput: InputType) => {
            prevActiveInput.current = updatedInput
            const oppositeInput = oppositeOf(updatedInput)

            try {
                setOnSwapLoadingPair((prev) => ({ ...prev, [oppositeInput]: true }))

                const result = await staticSwap(
                    parseOnChainTokenPair(unwrapPair(selectedTokenPair)),
                    inputValuePair,
                    tradeType,
                    swapConfigs.minSplits,
                    swapConfigs.maxSplits,
                    swapConfigs.maxSwapsPerPath
                )
                setActiveInput(undefined)
                setOnSwapLoadingPair((prev) => ({ ...prev, [oppositeInput]: false }))

                if ('errorCode' in result) {
                    setStaticSwapResult(undefined)
                    setInputValuePair({ [InputType.BASE]: '', [InputType.QUOTE]: '' })

                    alert('No route found for the selected pair')
                } else {
                    setStaticSwapResult(result)
                    setInputValuePair((prev) => ({ ...prev, [oppositeInput]: result.quote }))

                    const [quote, base] =
                        swapMetadata.tradeType === TradeType.EXACT_INPUT
                            ? [result.quoteDecimals, getReadableAmount(InputType.BASE)]
                            : [getReadableAmount(InputType.QUOTE), result.quoteDecimals]

                    const gasToPay = computeMaxSpent(result.gasUseEstimate, swapConfigs.gasBuffer)

                    setSwapMetadata({
                        tradeType,
                        bestPrice: (parseFloat(quote) / parseFloat(base)).toString(),
                        minimumReceived: computeMinReceivedFloat(quote, swapConfigs.slippage),
                        maximumSpent: computeMaxSpentFloat(base, swapConfigs.slippage),
                        gasToPay,
                        ethFee: parseReadableAmount(
                            (BigInt(gasToPay) * BigInt(result.gasPriceWei)).toString(),
                            18
                        ),
                        usdFee: computeMaxSpentFloat(
                            result.gasUseEstimateUSD,
                            swapConfigs.gasBuffer
                        ),
                    })
                }
            } catch {
                setInputValuePair((prev) => ({ ...prev, [oppositeInput]: '' }))
            }
        },
        [selectedTokenPair, inputValuePair, swapConfigs]
    )

    useEffect(() => {
        if (allFilled(selectedTokenPair) && someFilled(inputValuePair) && activeInput) {
            const tradeType =
                activeInput === InputType.BASE ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
            handleSwap(tradeType, activeInput)
        }
    }, [selectedTokenPair, inputValuePair, activeInput])

    useEffect(() => {
        if (allFilled(selectedTokenPair) && allFilled(inputValuePair) && prevActiveInput.current) {
            const tradeType =
                prevActiveInput.current === InputType.BASE
                    ? TradeType.EXACT_INPUT
                    : TradeType.EXACT_OUTPUT
            handleSwap(tradeType, prevActiveInput.current)
        }
    }, [swapConfigs])

    return {
        // tokens
        tokenList,
        parseOffChainToken,
        getReadableAmount,

        // pairs
        selectedTokenPair,
        balancePair,
        fiatPricePair,
        inputValuePair,
        onSwapLoadingPair,

        // pair handlers
        handleUpdateToken,
        handleFlipOrder,
        handleUpdateBalance,
        handleUpdateFiatPrice,
        handleUpdateInputValue,

        // swap
        swapConfigs,
        setSwapConfigs,
        swapMetadata,
        staticSwapResult,
        handleSwap,
    }
}

export default useStaticSwap
