'use client'

import { useEffect, useState } from 'react'
import { InputType, OffChainToken, Pair } from '@utils/types'
import { certificatedLogoUri, parseReadableAmount } from '@utils/offchain/tokens'
import { useWalletContext } from '@aawallet-sdk'
import { useStaticSwapContext } from '@providers/StaticSwapProvider'
import { oppositeOf } from '@utils/offchain/base'

const TokenInput = ({ input }: { input: InputType }) => {
  const { userWallet } = useWalletContext()
  const {
    tokenList,
    getReadableAmount,
    selectedTokenPair,
    balancePair,
    fiatPricePair,
    inputValuePair,
    onSwapLoadingPair,
    handleUpdateToken,
    handleUpdateBalance,
    handleUpdateFiatPrice,
    handleUpdateInputValue,
  } = useStaticSwapContext()

  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false)
  const [tempAmount, setTempAmount] = useState<string>('')

  const handleTokenChange = (selected: OffChainToken) => {
    handleUpdateToken(input, selected)
    setDropdownOpen(false)
  }
  const handleOnBlur = () => {
    handleUpdateInputValue(input, tempAmount)
  }

  useEffect(() => {
    ;(async () => {
      const readableAmount = getReadableAmount(input)
      setTempAmount(readableAmount)

      if (readableAmount) await handleUpdateFiatPrice(input, readableAmount)
    })()
  }, [selectedTokenPair, inputValuePair])

  useEffect(() => {
    ;(async () => {
      if (userWallet) await handleUpdateBalance(input, userWallet.address)
    })()
  }, [selectedTokenPair, userWallet])

  return (
    <div className="w-full select-none rounded-lg bg-gray-950 p-3 shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-gray-400">{input}</span>
        <span className="cursor-pointer text-xs text-gray-400">
          Balance:{' '}
          {balancePair[input]
            ? parseReadableAmount(balancePair[input], selectedTokenPair[input]!.decimals)
            : '..'}
        </span>
      </div>

      <div className="mb-2 flex w-full items-center justify-between rounded-lg">
        <div
          className="mr-4 flex cursor-pointer items-center justify-between rounded-lg bg-gray-900 p-3"
          onClick={() => setDropdownOpen(!isDropdownOpen)}
        >
          {selectedTokenPair[input] ? (
            <>
              <img
                src={certificatedLogoUri(selectedTokenPair[input].logoURI)}
                alt={selectedTokenPair[input].symbol}
                className="mr-2 h-6 w-6 rounded-full"
              />
              <span className="text-sm font-medium">{selectedTokenPair[input].symbol}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-400">Choose token</span>
          )}
          <span className="ml-2 text-gray-400">▼</span>
        </div>

        <div className={onSwapLoadingPair[input] ? 'animate-pulse' : ''}>
          <input
            type="text"
            value={selectedTokenPair[input] ? tempAmount : 'select token'}
            disabled={!selectedTokenPair[input] || onSwapLoadingPair[input]}
            onChange={(e) => setTempAmount(e.target.value)}
            onBlur={handleOnBlur}
            placeholder={selectedTokenPair[input] ? '0.00' : 'select token'}
            className="w-full bg-transparent text-right text-2xl focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="text-right text-xs text-gray-400">${fiatPricePair[input]}</div>
        </div>
      </div>

      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 overflow-y-auto rounded-lg bg-gray-900 shadow-lg">
          {tokenList
            .filter((token) => token.symbol !== selectedTokenPair[oppositeOf(input)]?.symbol)
            .map((token) => (
              <div
                key={token.symbol}
                className="flex cursor-pointer items-center p-3 hover:bg-gray-700"
                onClick={() => handleTokenChange(token)}
              >
                <img
                  src={certificatedLogoUri(token.logoURI)}
                  alt={token.symbol}
                  className="mr-2 h-6 w-6 rounded-full"
                />
                <span className="text-sm font-medium">{token.symbol}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default TokenInput
