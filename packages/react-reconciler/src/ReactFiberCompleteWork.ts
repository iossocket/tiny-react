import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function completeWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
      return null;
    case HostComponent: {
      // 1. create DOM
      const { type } = workInProgress;
      const instance = document.createElement(type);
      // 2. init dom with properties
      finalizeInitialChildren(instance, newProps);
      // 3. mount child dom to parent dom
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
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

function finalizeInitialChildren(domElement: Element, props: any) {
  for (const propKey in props) {
    const nextProp = props[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = nextProp;
      }
    } else {
      (domElement as any)[propKey] = nextProp;
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child;

  while (nodeFiber !== null) {
    if (nodeFiber) {
      parent.appendChild(nodeFiber.stateNode);
    }
    nodeFiber = nodeFiber.sibling;
  }
}