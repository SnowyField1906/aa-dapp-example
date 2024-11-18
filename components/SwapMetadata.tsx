import { useStaticSwapContext } from '@providers/StaticSwapProvider'
import { TradeType } from '@uniswap/sdk-core'
import { allFilled } from '@utils/offchain/base'
import { certificatedLogoUri, parseReadableAmount, truncateDecimals } from '@utils/offchain/tokens'
import { formatFee, parseRouteString } from '@utils/offchain/uniswap'
import { InputType, ParsedRoute } from '@utils/types'
import { Fragment } from 'react'

const SwapMetadata = () => {
  const {
    swapMetadata,
    swapConfigs,
    parseOffChainToken,
    selectedTokenPair,
    onSwapLoadingPair,
    staticSwapResult,
  } = useStaticSwapContext()

  if (onSwapLoadingPair[InputType.BASE] || onSwapLoadingPair[InputType.QUOTE]) {
    return (
      <div className="animate-pulse space-y-2 rounded-lg bg-gray-800 p-4 text-sm">
        <div className="flex justify-between">
          <span className="my-[2px] h-4 w-1/3 rounded-full bg-gray-500"></span>
          <span className="my-[2px] h-4 w-1/6 rounded-full bg-gray-500"></span>
        </div>
        <div className="flex justify-between">
          <span className="my-[2px] h-4 w-1/6 rounded-full bg-gray-500"></span>
          <span className="my-[2px] h-4 w-1/2 rounded-full bg-gray-500"></span>
        </div>
        <div className="flex justify-between">
          <span className="my-[2px] h-4 w-1/4 rounded-full bg-gray-500"></span>
          <span className="my-[2px] h-4 w-1/12 rounded-full bg-gray-500"></span>
        </div>
        <div className="flex justify-between">
          <span className="my-[2px] h-4 w-1/6 rounded-full bg-gray-500"></span>
          <span className="my-[2px] h-4 w-1/12 rounded-full bg-gray-500"></span>
        </div>
        <div className="flex justify-between">
          <span className="my-[2px] h-4 w-1/4 rounded-full bg-gray-500"></span>
          <span className="my-[2px] h-4 w-1/2 rounded-full bg-gray-500"></span>
        </div>
      </div>
    )
  }

  if (!staticSwapResult || !swapMetadata.bestPrice) {
    return null
  }

  const parsedRoute: ParsedRoute[] = parseRouteString(
    staticSwapResult.routeString,
    staticSwapResult.route
  )

  return (
    <div className="space-y-2 rounded-lg bg-gray-800 p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">
          {swapMetadata.tradeType === TradeType.EXACT_INPUT ? 'Minimum Received' : 'Maximum Spent'}
        </span>
        <span className="text-white">
          {truncateDecimals(
            swapMetadata.tradeType === TradeType.EXACT_INPUT
              ? swapMetadata.minimumReceived
              : swapMetadata.maximumSpent,
            6
          )}{' '}
          {
            selectedTokenPair[
              swapMetadata.tradeType === TradeType.EXACT_INPUT ? InputType.QUOTE : InputType.BASE
            ]?.symbol
          }
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Best Price</span>
        <span className="text-white">
          {truncateDecimals(swapMetadata.bestPrice, 6)} {selectedTokenPair[InputType.QUOTE]?.symbol}{' '}
          per {selectedTokenPair[InputType.BASE]?.symbol}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Price Impact</span>
        <span className="text-white">{staticSwapResult?.priceImpact}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Slippage</span>
        <span className="text-white">{swapConfigs.slippage}%</span>
      </div>
      <div className="flex justify-between pb-4">
        <span className="text-gray-400">Gas Estimated</span>
        <span className="text-white">
          {truncateDecimals(swapMetadata.gweiFee, 0)}
          {' Gwei ≈ $'}
          {truncateDecimals(staticSwapResult.gasUseEstimateUSD, 4)}
        </span>
      </div>

      <hr className="border-gray-700" />

      <div className="flex w-full max-w-2xl flex-col space-y-2 pt-4">
        {parsedRoute.map(({ percentage, hops }, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <img
                src={certificatedLogoUri(parseOffChainToken(hops[0].tokenA).logoURI)}
                alt={hops[0].tokenA.symbol}
                className="h-6 w-6 rounded-full"
              />
            </div>

            <div className="flex flex-1 items-center">
              <div className="flex items-center space-x-1 rounded-lg bg-gray-200 px-2 py-0.5 font-mono text-sm font-medium text-gray-800">
                <span>V3</span>
                <span>{percentage}%</span>
              </div>

              <div className="mx-2 flex-1 border-t-2 border-dotted border-gray-200" />

              {hops.map((pool, poolIndex) => (
                <Fragment key={poolIndex}>
                  <div className="flex items-center space-x-1 ">
                    <div className="flex rounded-lg bg-gray-200 p-0.5 font-mono text-xs font-medium text-gray-800">
                      <img
                        src={certificatedLogoUri(parseOffChainToken(pool.tokenA).logoURI)}
                        alt={pool.tokenA.symbol}
                        className="h-4 w-4 rounded-full border-[0.5px] border-gray-800"
                      />
                      <img
                        src={certificatedLogoUri(parseOffChainToken(pool.tokenB).logoURI)}
                        alt={pool.tokenB.symbol}
                        className="-ml-2 h-4 w-4 rounded-full border-[0.5px] border-gray-800"
                      />
                      <span className="mx-1">{formatFee(pool.fee)}</span>
                    </div>
                  </div>
                  {poolIndex < hops.length - 1 && (
                    <div className="mx-2 flex-1 border-t-2 border-dotted border-gray-200" />
                  )}
                </Fragment>
              ))}

              <div className="mx-2 flex-1 border-t-2 border-dotted border-gray-200" />
            </div>

            <div className="flex-shrink-0">
              <img
                src={certificatedLogoUri(parseOffChainToken(hops[hops.length - 1].tokenB).logoURI)}
                alt={hops[hops.length - 1].tokenB.symbol}
                className="h-6 w-6 rounded-full"
              />
            </div>
          </div>
        ))}
        <p className="pt-4 text-center text-xs text-gray-400">
          This route optimizes your total output by considering
          <br />
          split routes, multiple hops, and the gas cost of each step.
        </p>
      </div>
    </div>
  )
}

export default SwapMetadata
