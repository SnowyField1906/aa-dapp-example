import { useStaticSwapContext } from '@providers/StaticSwapProvider';
import { allFilled } from '@utils/offchain/base';
import { InputType } from '@utils/types';

const SwapMetadata = () => {
  const {
    selectedTokenPair,
    inputValuePair,
    onSwapLoadingPair,
    staticSwapResult,
  } = useStaticSwapContext();

  if (onSwapLoadingPair[InputType.BASE] || onSwapLoadingPair[InputType.QUOTE]) {
    return (
      <div className="animate-pulse bg-gray-800 p-4 rounded-lg text-sm space-y-2">
        <div className="flex justify-between">
          <span className="bg-gray-500 h-4 w-1/2"></span>
          <span className="bg-gray-500 h-4 w-1/4"></span>
        </div>
        <div className="flex justify-between">
          <span className="bg-gray-500 h-4 w-1/2"></span>
          <span className="bg-gray-500 h-4 w-1/4"></span>
        </div>
        <div className="flex justify-between">
          <span className="bg-gray-500 h-4 w-1/2"></span>
          <span className="bg-gray-500 h-4 w-1/4"></span>
        </div>
        <div className="flex justify-between">
          <span className="bg-gray-500 h-4 w-1/2"></span>
          <span className="bg-gray-500 h-4 w-1/4"></span>
        </div>
      </div>
    );
  }

  if (!staticSwapResult) {
    return null;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-sm space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-400">Minimum Received</span>
        <span className="text-white">79.01222</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Rate</span>
        <span className="text-white">
          {allFilled(inputValuePair)
            ? (
                parseFloat(inputValuePair[InputType.QUOTE]!) /
                parseFloat(inputValuePair[InputType.BASE]!)
              ).toFixed(6)
            : 0}{' '}
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
        <span className="text-white">0.1%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Liquidity Source Fee</span>
        <span className="text-white">0.3%</span>
      </div>

      {/* <div
        className={
          staticSwapResult!.route.length > 0
            ? 'h-48 flex flex-col'
            : 'h-48 flex flex-col animate-pulse'
        }
      >
        <div className="space-y-8">
          {staticSwapResult!.route.map((routeStep, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 border border-gray-100"
            >
              <h3 className="text-lg font-semibold mb-4">
                Route Step {index + 1} (
                {((routeStep[0].amountIn / 1e18) * 100).toFixed(2)}%)
              </h3>
              {routeStep.map((pool, i) => (
                <div
                  key={i}
                  className="border-b last:border-0 pb-4 mb-4 last:pb-0 last:mb-0"
                >
                  <div className="mb-2 text-sm font-medium text-gray-500">
                    Pool: {pool.type.toUpperCase()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-gray-700 font-semibold">Token In</h4>
                      <p className="text-gray-600">
                        Symbol: {pool.tokenIn.symbol}
                      </p>
                      <p className="text-gray-600">
                        Amount: {(pool.amountIn / 1e18).toFixed(4)}
                      </p>
                      <p className="text-gray-600">
                        Address: {pool.tokenIn.address}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-gray-700 font-semibold">Token Out</h4>
                      <p className="text-gray-600">
                        Symbol: {pool.tokenOut.symbol}
                      </p>
                      <p className="text-gray-600">
                        Amount: {(pool.amountOut / 1e18).toFixed(4)}
                      </p>
                      <p className="text-gray-600">
                        Address: {pool.tokenOut.address}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-gray-500">
                    <p>Fee Tier: {(pool.fee / 10000).toFixed(2)}%</p>
                    <p>Liquidity: {Number(pool.liquidity).toLocaleString()}</p>
                    <p>
                      Sqrt Price X96:{' '}
                      {Number(pool.sqrtRatioX96).toLocaleString()}
                    </p>
                    <p>Current Tick: {pool.tickCurrent}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default SwapMetadata;
