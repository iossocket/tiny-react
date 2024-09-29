import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { ClassComponent, ContextProvider, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { popProvider } from "./ReactFiberNewContext";

export function completeWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case FunctionComponent:
    case ClassComponent:
    case Fragment:
    case HostRoot:
      return null;
    case ContextProvider: {
      popProvider(workInProgress.type._context);
      return null;
    }
    case HostComponent: {
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        // 1. create DOM
        const instance = document.createElement(type);
        // 2. init dom with properties
        finalizeInitialChildren(instance, null, newProps);
        // 3. mount child dom to parent dom
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
      }
      return null;
    }
    case HostText: {
      workInProgress.stateNode = document.createTextNode(newProps);
      return null;
    }

  }
  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
    "React. Please file an issue."
  );
}

function updateHostComponent(current: Fiber, workInProgress: Fiber, type: string, newProps: any) {
  if (current.memoizedProps === newProps) {
    return;
  }
  finalizeInitialChildren(
    workInProgress.stateNode as Element,
    current.memoizedProps,
    newProps
  );
}

function finalizeInitialChildren(domElement: Element, prevProps: any, nextProps: any) {
  for (const propKey in prevProps) {
    const prevProp = prevProps[propKey];
    if (propKey === "children") {
      if (isStr(prevProp) || isNum(prevProp)) {
        domElement.textContent = "";
      }
    } else {
      if (propKey === "onClick") {
        domElement.removeEventListener("click", prevProp);
      } else {
        (domElement as any)[propKey] = "";
      }
    }
  }

  for (const propKey in nextProps) {
    const nextProp = nextProps[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = nextProp + "";
      }
    } else {
      if (propKey === "onClick") {
        domElement.addEventListener("click", nextProp);
      } else {
        (domElement as any)[propKey] = nextProp;
      }
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child;
  while (nodeFiber !== null) {
    if (nodeFiber.tag === HostComponent || nodeFiber.tag === HostText) {
      parent.appendChild(nodeFiber.stateNode);
    } else if (nodeFiber.child !== null) {
      nodeFiber = nodeFiber.child;
      continue;
    }

    if (nodeFiber === workInProgress) {
      return;
    }

    while (nodeFiber.sibling === null) {
      if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
        return;
      }
      nodeFiber = nodeFiber.return;
    }
    nodeFiber = nodeFiber.sibling;
  }
}

export function isHost(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}