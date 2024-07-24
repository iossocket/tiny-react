import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot } from "./ReactWorkTags";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";

export function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot: // first fiber node
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
  }
  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
    "React. Please file an issue."
  );
}

function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
  const nextChildren = workInProgress.memoizedState.element;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type } = workInProgress;
  let nextChildren = workInProgress.pendingProps.children;
  const isDirectTextChild = shouldSetTextContent(
    type,
    workInProgress.pendingProps
  );

  if (isDirectTextChild) {
    nextChildren = null;
    return null;
  }

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any
) {
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    isStr(props.children) ||
    isNum(props.children) ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}