import { useState, useEffect, useCallback, useRef } from 'react'
import {
    getTokenFiatPrice,
    getTokenList,
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
import { getBalance } from '@utils/onchain/tokens'
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
        slippage: 30,
        gasBuffer: 10,
    })
    const [swapMetadata, setSwapMetadata] = useState<SwapMetadata>({
        minimumReceived: '',
        maximumSpent: '',
        gasToPay: '',
        gweiFee: '',
        bestPrice: '',
        tradeType: TradeType.EXACT_INPUT,
    })

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
        setSelectedTokenPair({ ...selectedTokenPair, [input]: token })
        if (inputValuePair[oppositeOf(input)]) {
            setActiveInput(oppositeOf(input))
        }
    }
    const handleUpdateBalance = async (input: InputType, address: string) => {
        try {
            const r = await getBalance(selectedTokenPair[input]!.address, address)
            setBalancePair({ ...balancePair, [input]: r })
        } catch {
            setBalancePair({ ...balancePair, [input]: '' })
        }
    }
    const handleUpdateFiatPrice = async (input: InputType, amount: string) => {
        try {
            const r = await getTokenFiatPrice(selectedTokenPair[input]!.symbol, amount)
            setFiatPricePair({ ...fiatPricePair, [input]: r })
        } catch {
            setFiatPricePair({ ...fiatPricePair, [input]: '' })
        }
    }
    const handleUpdateInputValue = (input: InputType, amount: string) => {
        try {
            const r = parseTokenValue(amount, selectedTokenPair[input]!.decimals)
            setInputValuePair({ ...inputValuePair, [input]: r })
            setActiveInput(input)
        } catch {
            setInputValuePair({ ...inputValuePair, [input]: '' })
        }
    }

    const handleUpdateMetadata = (tradeType: TradeType, result: UniswapStaticSwapResponse) => {
        const readableQuote = parseReadableAmount(
            result.quote,
            selectedTokenPair[InputType.QUOTE]!.decimals
        )

        setSwapMetadata({
            tradeType,
            minimumReceived: (
                parseFloat(readableQuote) *
                (1 - swapConfigs.slippage / 100)
            ).toString(),
            maximumSpent: (
                parseFloat(getReadableAmount(InputType.BASE)) *
                (1 + swapConfigs.slippage / 100)
            ).toString(),
            gweiFee: parseReadableAmount(
                (BigInt(result!.gasUseEstimate) * BigInt(result!.gasPriceWei)).toString(),
                9
            ),
            bestPrice: (
                parseFloat(readableQuote) / parseFloat(getReadableAmount(InputType.BASE))
            ).toString(),
            gasToPay: (
                Number(result!.gasUseEstimate) *
                (1 + swapConfigs.gasBuffer / 100)
            ).toString(),
        })
    }

    const handleSwap = useCallback(
        async (tradeType: TradeType, updatedInput: InputType) => {
            const oppositeInput = oppositeOf(updatedInput)

            try {
                setOnSwapLoadingPair({ ...onSwapLoadingPair, [oppositeInput]: true })

                const result = await staticSwap(
                    parseOnChainTokenPair(unwrapPair(selectedTokenPair)),
                    inputValuePair,
                    tradeType
                )
                setActiveInput(undefined)
                setOnSwapLoadingPair({ ...onSwapLoadingPair, [oppositeInput]: false })

                if ('errorCode' in result) {
                    setStaticSwapResult(undefined)
                    setInputValuePair({ [InputType.BASE]: '', [InputType.QUOTE]: '' })

                    alert('No route found for the selected pair')
                } else {
                    setStaticSwapResult(result)
                    setInputValuePair({ ...inputValuePair, [oppositeInput]: result.quote })

                    handleUpdateMetadata(tradeType, result)
                }
            } catch {
                setInputValuePair({ ...inputValuePair, [oppositeInput]: '' })
            }
        },

        [selectedTokenPair, inputValuePair]
    )

    useEffect(() => {
        if (allFilled(selectedTokenPair) && someFilled(inputValuePair) && activeInput) {
            const tradeType =
                activeInput === InputType.BASE ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
            handleSwap(tradeType, activeInput)
        }
    }, [selectedTokenPair, inputValuePair, activeInput])

    useEffect(() => {
        if (staticSwapResult && swapMetadata.tradeType) {
            handleUpdateMetadata(swapMetadata.tradeType, staticSwapResult)
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
