'use client';

import { FaCog, FaExchangeAlt } from 'react-icons/fa';
import { InputType } from '@utils/types';
import TokenInput from './TokenInput';
import SwapMetadata from './SwapMetadata';
import { useStaticSwapContext } from '@providers/StaticSwapProvider';

const Swap = () => {
  const { handleFlipOrder } = useStaticSwapContext();

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg w-2xl mx-auto shadow-lg flex flex-col gap-6">
      <FaCog className="text-gray-400 cursor-pointer ml-auto" />

      <hr className="border-gray-700" />

      <TokenInput input={InputType.BASE} />

      <div className="flex justify-center items-center">
        <FaExchangeAlt
          className="text-gray-400 cursor-pointer"
          onClick={handleFlipOrder}
        />
      </div>

      <TokenInput input={InputType.QUOTE} />

      <SwapMetadata />

      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
        SWAP
      </button>
    </div>
  );
};

export default Swap;
