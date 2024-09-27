import { isFn } from "shared/utils";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";
import { HookFlags, HookLayout, HookPassive } from "./ReactHookEffectTags";
import { Flags, Passive, Update } from "./ReactFiberFlags";

type Hook = {
  memorizedState: any;
  next: null | Hook;
}

type Effect = {
  tag: HookFlags;
  create: () => (() => void) | void;
  deps: Array<any> | void | null;
  next: Effect | null;
}

let currentlyRenderingFiber: Fiber | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  props: Props
): any {
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  let children = Component(props);

  finishRenderingHooks();

  return children;
}

function finishRenderingHooks() {
  currentlyRenderingFiber = null;
  currentHook = null;
  workInProgressHook = null;
}

type Dispatch<A> = (action: A) => void;

export function useReducer<S, I, A>(
  reducer: (state: S, action: A) => S | null,
  initialArg: I,
  init?: (initialArg: I) => S
) {
  // !1. construct hook linked list
  const hook: Hook = updateWorkInProgressHook();

  let initialState: S;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg as any;
  }

  // !2. differentiate mount & update
  if (!currentlyRenderingFiber.alternate) {
    // render at very first time
    hook.memorizedState = initialState;
  }

  // !3 dispatch
  const dispatch: Dispatch<A> = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    hook,
    reducer
  )

  return [hook.memorizedState, dispatch];
}

function updateWorkInProgressHook(): Hook {
  let hook: Hook;
  const current = currentlyRenderingFiber.alternate;
  if (current) {
    console.log('%c [ update hook ]-74', 'font-size:13px; background:pink; color:#bf2c9f;',)
    // update
    currentlyRenderingFiber.memoizedState = current.memoizedState;
    if (workInProgressHook) {
      workInProgressHook = hook = workInProgressHook.next;
      currentHook = currentHook.next;
    } else {
      hook = workInProgressHook = currentlyRenderingFiber.memoizedState;
      currentHook = current.memoizedState;
    }
  } else {
    // render at very first time
    currentHook = null;
    hook = { memorizedState: null, next: null };
    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      workInProgressHook = currentlyRenderingFiber.memoizedState = hook;
    }
  }

  return hook;
}

function dispatchReducerAction<S, I, A>(
  fiber: Fiber,
  hook: Hook,
  reducer: (state: S, action: A) => S | null,
  action: any
) {
  hook.memorizedState = reducer ? reducer(hook.memorizedState, action) : action;
  console.log('%c [ hook.memorizedState ]-104', 'font-size:13px; background:pink; color:#bf2c9f;', hook.memorizedState);
  const root = getRootForUpdatedFiber(fiber);
  fiber.alternate = { ...fiber };
  if (fiber.sibling) {
    fiber.sibling.alternate = fiber.sibling;
  }
  scheduleUpdateOnFiber(root, fiber, true);
}

function getRootForUpdatedFiber(sourceFiber: Fiber): FiberRoot {
  let node = sourceFiber;
  let parent = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  return node.tag === HostRoot ? node.stateNode : null;
}

// difference between useState and useReducer:
// useState won't trigger component update if state not change, while useReduce will
// reduce provide a function for state update instead of override the previous state, with reducer, it can be reuse easier.
export function useState<S>(initialState: (() => S) | S) {
  const init = isFn(initialState) ? (initialState as any)() : initialState;
  return useReducer(null, init);
}

export function useMemo<S>(
  nextCreate: () => S,
  deps: Array<any> | void | null
): S {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memorizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<any> | null = prevState[1];
      if (areHookInputsEqual(nextDeps as any, prevDeps)) {
        return prevState[0];
      }
    }
  }

  const nextValue = nextCreate();
  hook.memorizedState = [nextValue, nextDeps];
  return nextValue;
}

export function areHookInputsEqual(
  nextDeps: Array<any>,
  prevDeps: Array<any> | null
): boolean {
  if (prevDeps === null) {
    return false;
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

export function useCallback<S>(
  callback: S,
  deps: Array<any> | void | null
): S {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memorizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      if (areHookInputsEqual(nextDeps as any, prevDeps)) {
        return prevState[0];
      }
    }
  }

  hook.memorizedState = [callback, nextDeps];
  return callback;
}

export function useRef<S>(initialValue: S): { current: S } {
  const hook = updateWorkInProgressHook();
  if (currentHook === null) {
    hook.memorizedState = { current: initialValue };
  }
  return hook.memorizedState;
}

// useLayoutEffect and useEffect have same structure
// create & cleanup function are executed in different timing
export function useLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  return updateEffectImpl(Update, HookLayout, create, deps);
}

export function useEffect(
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  return updateEffectImpl(Passive, HookPassive, create, deps);
}

function updateEffectImpl(
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  const hook = updateWorkInProgressHook();
  const nextDeps = (deps === undefined) ? null : deps;
  if (currentHook !== null) {
    if (nextDeps !== null) {
      const prevDeps = currentHook.memorizedState.deps;
      if (areHookInputsEqual(nextDeps as any[], prevDeps)) {
        return;
      }
    }
  }
  currentlyRenderingFiber!.flags |= fiberFlags;
  // 1. save effect; 2. construct effect linked list
  hook.memorizedState = pushEffect(hookFlags, create, nextDeps);
}

function pushEffect(
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  const effect: Effect = {
    tag: hookFlags,
    create,
    deps,
    next: null
  }

  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = {
      lastEffect: null
    };
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }

  return effect;
}

export function useContext(context: any) {
  return context._currentValue;
}