import { Fiber } from "./ReactInternalTypes";

type Hook = {
  memorizedState: any;
  next: null | Hook;
}

let currentlyRenderFiber: Fiber | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  props: Props
): any {
  currentlyRenderFiber = workInProgress;
  workInProgress.memoizedState = null;

  let children = Component(props);

  finishRenderingHooks();

  return children;
}

function finishRenderingHooks() {
  currentlyRenderFiber = null;
  currentHook = null;
  workInProgressHook = null;
}

export function useReducer<S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (initialArg: I) => S
) {
  // !1. construct hook linked list
  const hook: Hook = { memorizedState: null, next: null };

  let initialState: S;
  if (init) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg as any;
  }

  // !2. differentiate mount & update
  hook.memorizedState = initialState;

  // !3 dispatch
  const dispatch = (action: A) => {
    const newValue = reducer(initialState, action);
    // should scheduleUpdateOnFiber here
    console.log('%c [ dispatch ]-56', 'font-size:13px; background:pink; color:#bf2c9f;', newValue);
  }

  return [hook.memorizedState, dispatch];
}