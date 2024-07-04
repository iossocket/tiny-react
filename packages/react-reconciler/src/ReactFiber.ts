import type { ReactElement } from "shared/ReactTypes";
import { NoFlags } from "./ReactFiberFlags";
import { Fiber } from "./ReactInternalTypes";
import { ClassComponent, ContextConsumer, ContextProvider, Fragment, FunctionComponent, HostComponent, IndeterminateComponent, MemoComponent, WorkTag } from "./ReactWorkTags";
import {
  REACT_CONTEXT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROVIDER_TYPE,
} from "shared/ReactSymbols";
import { isFn, isStr } from "shared/utils";

export function createFiber(
  tag: WorkTag,
  pendingProps: any,
  key: null | string
): Fiber {
  return new FiberNode(tag, pendingProps, key);
};

function FiberNode(tag: WorkTag, pendingProps: any, key: null | string) {
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;

  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;

  this.memoizedState = null;

  this.flags = NoFlags;

  this.alternate = null;
}

export function createFiberFromElement(element: ReactElement) {
  const { type, key } = element;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
  return fiber;
}

export function createFiberFromTypeAndProps(
  type: any,
  key: null | string,
  pendingProps: any
) {
  let fiberTag: WorkTag = IndeterminateComponent;

  if (isFn(type)) {
    // 函数组件、类组件
    if (type.prototype.isReactComponent) {
      fiberTag = ClassComponent;
    } else {
      fiberTag = FunctionComponent;
    }
  } else if (isStr(type)) {
    // 原生标签
    fiberTag = HostComponent;
  } else if (type === REACT_FRAGMENT_TYPE) {
    fiberTag = Fragment;
  } else if (type.$$typeof === REACT_PROVIDER_TYPE) {
    fiberTag = ContextProvider;
  } else if (type.$$typeof === REACT_CONTEXT_TYPE) {
    fiberTag = ContextConsumer;
  } else if (type.$$typeof === REACT_MEMO_TYPE) {
    fiberTag = MemoComponent;
  }

  const fiber = createFiber(fiberTag, pendingProps, key);
  fiber.elementType = type;
  fiber.type = type;
  return fiber;
}

export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
  }
  workInProgress.flags = current.flags;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}