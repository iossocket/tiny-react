import { isNum, isStr } from "shared/utils";
import { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot } from "./ReactWorkTags";

export function completeWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return null;
    case HostComponent: {
      // 1. create DOM
      const { type } = workInProgress;
      const instance = document.createElement(type);
      // 2. init dom with properties
      finalizeInitialChildren(instance, workInProgress.pendingProps);
      // 3. mount child dom to parent dom
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
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
  if (nodeFiber) {
    parent.appendChild(nodeFiber.stateNode);
  }
}