import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";

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

type Dispatch<A> = (action: A) => void;

export function useReducer<S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (initialArg: I) => S
) {
  // !1. construct hook linked list
  const hook: Hook = updateWorkInProgressHook();

  let initialState: S;
  if (init) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg as any;
  }

  // !2. differentiate mount & update
  if (!currentlyRenderFiber.alternate) {
    // render at very first time
    hook.memorizedState = initialState;
  }

  // !3 dispatch
  const dispatch: Dispatch<A> = dispatchReducerAction.bind(
    null,
    currentlyRenderFiber,
    hook,
    reducer
  )

  return [hook.memorizedState, dispatch];
}

function updateWorkInProgressHook(): Hook {
  let hook: Hook;
  const current = currentlyRenderFiber.alternate;
  if (current) {
    // update
    currentlyRenderFiber.memoizedState = current.memoizedState;
    if (workInProgressHook) {
      workInProgressHook = hook = workInProgressHook.next;
      currentHook = currentHook.next;
    } else {
      hook = workInProgressHook = currentlyRenderFiber.memoizedState;
      currentHook = current.memoizedState;
    }
  } else {
    // render at very first time
    currentHook = null;
    hook = { memorizedState: null, next: null };
    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      workInProgressHook = currentlyRenderFiber.memoizedState = hook;
    }
  }

  return hook;
}

function dispatchReducerAction<S, I, A>(
  fiber: Fiber,
  hook: Hook,
  reducer: (state: S, action: A) => S,
  action: any
) {
  hook.memorizedState = reducer ? reducer(hook.memorizedState, action) : action;
  const root = getRootForUpdatedFiber(fiber);
  fiber.alternate = { ...fiber };
  if (fiber.sibling) {
    fiber.sibling.alternate = fiber.sibling;
  }
  scheduleUpdateOnFiber(root, fiber);
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