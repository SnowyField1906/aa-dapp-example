import { useStaticSwapContext } from '@providers/StaticSwapProvider'
import { SwapConfigs } from '@utils/types'
import { useState } from 'react'

const UpdateConfigsModal = ({ onClose }: { onClose: () => void }) => {
  const { swapConfigs, setSwapConfigs } = useStaticSwapContext()
  const [currentSwapConfigs, setCurrentSwapConfigs] = useState<SwapConfigs>(swapConfigs)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (key: keyof SwapConfigs, value: string) => {
    const parsedValue = parseFloat(value)
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      setCurrentSwapConfigs((prev) => ({
        ...prev,
        [key]: parsedValue,
      }))
      setError(null)
    } else {
      setError('Values must be non-negative numbers.')
    }
  }

  const handleSave = () => {
    setSwapConfigs(currentSwapConfigs)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Update Swap Configurations</h2>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="slippage" className="text-sm text-gray-400">
              Slippage (%)
            </label>
            <input
              id="slippage"
              type="number"
              step="0.01"
              value={currentSwapConfigs.slippage}
              onChange={(e) => handleInputChange('slippage', e.target.value)}
              className="rounded bg-gray-800 p-2 text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="gasBuffer" className="text-sm text-gray-400">
              Gas Buffer (%)
            </label>
            <input
              id="gasBuffer"
              type="number"
              step="1"
              value={currentSwapConfigs.gasBuffer}
              onChange={(e) => handleInputChange('gasBuffer', e.target.value)}
              className="rounded bg-gray-800 p-2 text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="minSplits" className="text-sm text-gray-400">
              Minimum Paths/Routes
            </label>
            <input
              id="minSplits"
              type="number"
              step="1"
              value={currentSwapConfigs.minSplits}
              onChange={(e) => handleInputChange('minSplits', e.target.value)}
              className="rounded bg-gray-800 p-2 text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="maxSplits" className="text-sm text-gray-400">
              Maximum Paths/Routes
            </label>
            <input
              id="maxSplits"
              type="number"
              step="1"
              value={currentSwapConfigs.maxSplits}
              onChange={(e) => handleInputChange('maxSplits', e.target.value)}
              className="rounded bg-gray-800 p-2 text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="maxSwapsPerPath" className="text-sm text-gray-400">
              Maximum Hops Per Path/Route
            </label>
            <input
              id="maxSwapsPerPath"
              type="number"
              step="1"
              value={currentSwapConfigs.maxSwapsPerPath}
              onChange={(e) => handleInputChange('maxSwapsPerPath', e.target.value)}
              className="rounded bg-gray-800 p-2 text-white focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="rounded bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!!error}
            className={`rounded px-4 py-2 text-sm ${
              error
                ? 'cursor-not-allowed bg-gray-700 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdateConfigsModal
