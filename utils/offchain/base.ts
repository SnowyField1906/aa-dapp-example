import { InputType, Pair, PairOpt } from '@utils/types';

export const unwrapPair = <T>(pair: PairOpt<T>): Pair<T> => {
  return {
    [InputType.BASE]: pair[InputType.BASE]!,
    [InputType.QUOTE]: pair[InputType.QUOTE]!,
  };
};

export const oppositeOf = (input: InputType): InputType => {
  return input === InputType.BASE ? InputType.QUOTE : InputType.BASE;
};

export const allFilled = <T>(pair: PairOpt<T>): boolean => {
  return !!pair[InputType.BASE] && !!pair[InputType.QUOTE];
};
export const someFilled = <T>(pair: PairOpt<T>): boolean => {
  return !!pair[InputType.BASE] || !!pair[InputType.QUOTE];
};

export const allEmpty = <T>(pair: PairOpt<T>): boolean => {
  return !pair[InputType.BASE] && !pair[InputType.QUOTE];
};
export const someEmpty = <T>(pair: PairOpt<T>): boolean => {
  return !pair[InputType.BASE] || !pair[InputType.QUOTE];
};
