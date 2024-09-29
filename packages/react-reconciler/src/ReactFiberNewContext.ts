import { ReactContext } from "shared/ReactTypes";
import { createCursor, pop, push, StackCursor } from "./ReactFiberStack";

const valueCursor: StackCursor<any> = createCursor(null);

export function pushProvider<T>(context: ReactContext<T>, nextValue: T) {
  push(valueCursor, context._currentValue);
  context._currentValue = nextValue;
}

export function popProvider<T>(context: ReactContext<T>) {
  const currentValue = valueCursor.current;
  pop(valueCursor);
  context._currentValue = currentValue;
}

export function readContext<T>(context: ReactContext<T>): T {
  return context._currentValue;
}