import { useStaticSwapContext } from '@providers/StaticSwapProvider';
import { TradeType } from '@uniswap/sdk-core';
import { allFilled } from '@utils/offchain/base';
import {
  certificatedLogoUri,
  parseReadableAmount,
  truncateDecimals,
} from '@utils/offchain/tokens';
import { formatFee, parseRouteString } from '@utils/offchain/uniswap';
import { InputType, ParsedRoute } from '@utils/types';
import { Fragment } from 'react';

const SwapMetadata = () => {
  const {
    swapMetadata,
    swapConfigs,
    parseOffChainToken,
    selectedTokenPair,
    onSwapLoadingPair,
    staticSwapResult,
  } = useStaticSwapContext();

  if (onSwapLoadingPair[InputType.BASE] || onSwapLoadingPair[InputType.QUOTE]) {
    return (
      <div className="animate-pulse bg-gray-800 p-4 rounded-lg text-sm space-y-2">
        <div className="flex justify-between">
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/3"></span>
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/6"></span>
        </div>
        <div className="flex justify-between">
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/6"></span>
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/2"></span>
        </div>
        <div className="flex justify-between">
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/4"></span>
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/12"></span>
        </div>
        <div className="flex justify-between">
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/6"></span>
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/12"></span>
        </div>
        <div className="flex justify-between">
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/4"></span>
          <span className="bg-gray-500 rounded-full h-4 my-[2px] w-1/2"></span>
        </div>
      </div>
    );
  }

  if (!staticSwapResult) {
    return null;
  }

  const parsedRoute: ParsedRoute[] = parseRouteString(
    staticSwapResult.routeString,
    staticSwapResult.route
  );

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-sm space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-400">
          {swapMetadata.tradeType === TradeType.EXACT_INPUT
            ? 'Minimum Received'
            : 'Maximum Spent'}
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
              swapMetadata.tradeType === TradeType.EXACT_INPUT
                ? InputType.QUOTE
                : InputType.BASE
            ]?.symbol
          }
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Best Price</span>
        <span className="text-white">
          {truncateDecimals(swapMetadata.bestPrice, 6)}{' '}
          {selectedTokenPair[InputType.QUOTE]?.symbol} per{' '}
          {selectedTokenPair[InputType.BASE]?.symbol}
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

      <div className="flex flex-col space-y-2 w-full max-w-2xl pt-4">
        {parsedRoute.map(({ percentage, hops }, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <img
                src={certificatedLogoUri(
                  parseOffChainToken(hops[0].tokenA).logoURI
                )}
                alt={hops[0].tokenA.symbol}
                className="w-6 h-6 rounded-full"
              />
            </div>

            <div className="flex-1 flex items-center">
              <div className="bg-gray-200 rounded-lg px-2 py-0.5 flex items-center space-x-1 text-sm font-medium font-mono text-gray-800">
                <span>V3</span>
                <span>{percentage}%</span>
              </div>

              <div className="flex-1 mx-2 border-t-2 border-dotted border-gray-200" />

              {hops.map((pool, poolIndex) => (
                <Fragment key={poolIndex}>
                  <div className="flex items-center space-x-1 ">
                    <div className="flex bg-gray-200 text-gray-800 font-medium font-mono text-xs rounded-lg p-0.5">
                      <img
                        src={certificatedLogoUri(
                          parseOffChainToken(pool.tokenA).logoURI
                        )}
                        alt={pool.tokenA.symbol}
                        className="w-4 h-4 border-[0.5px] border-gray-800 rounded-full"
                      />
                      <img
                        src={certificatedLogoUri(
                          parseOffChainToken(pool.tokenB).logoURI
                        )}
                        alt={pool.tokenB.symbol}
                        className="w-4 h-4 border-[0.5px] border-gray-800 rounded-full -ml-2"
                      />
                      <span className="mx-1">{formatFee(pool.fee)}</span>
                    </div>
                  </div>
                  {poolIndex < hops.length - 1 && (
                    <div className="flex-1 mx-2 border-t-2 border-dotted border-gray-200" />
                  )}
                </Fragment>
              ))}

              <div className="flex-1 mx-2 border-t-2 border-dotted border-gray-200" />
            </div>

            <div className="flex-shrink-0">
              <img
                src={certificatedLogoUri(
                  parseOffChainToken(hops[hops.length - 1].tokenB).logoURI
                )}
                alt={hops[hops.length - 1].tokenB.symbol}
                className="w-6 h-6 rounded-full"
              />
            </div>
          </div>
        ))}
        <p className="text-gray-400 text-xs text-center pt-4">
          This route optimizes your total output by considering
          <br />
          split routes, multiple hops, and the gas cost of each step.
        </p>
      </div>
    </div>
  );
};

export default SwapMetadata;
