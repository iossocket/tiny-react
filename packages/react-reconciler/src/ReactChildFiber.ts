import type { ReactElement } from "shared/ReactTypes";
import { Placement } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { isArray } from "shared/utils";

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler = createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

function useFiber(fiber: Fiber, pendingProps: any): Fiber {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
}

function createChildReconciler(shouldTrackSideEffects: boolean) {
  function placeSingleChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  // reconcile single node, for mount phase, won't involve comparing and reusing existing node
  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement
  ) {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      if (child.key === key) {
        const elementType = element.type;
        // reuse when both key and type are same
        if (child.elementType === elementType) {
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        }
        break;
      } else {
        // 
      }
      child = child.sibling;
    }

    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string
  ) {
    const created = createFiberFromText(textContent);
    created.return = returnFiber;
    return created;
  }

  function createChild(returnFiber: Fiber, newChild: any) {
    if (isText(newChild)) {
      const created = createFiberFromText(newChild + "");
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
      }
    }
    return null;
  }

  function reconcileChildrenFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: any
  ) {
    let resultingFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild;
    let newIdx = 0;

    // mount at first time
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) {
          continue;
        }
        newFiber.index = newIdx;
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    return resultingFirstChild;
  }

  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
  ) {

    if (isText(newChild)) {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFirstChild, "" + newChild)
      );
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );
        }
      }
    }
    // handle new child is a list of nodes
    if (isArray(newChild)) {
      return reconcileChildrenFibers(returnFiber, currentFirstChild, newChild);
    }
    return null;
  }
  return reconcileChildFibers;
}

function isText(newChild: any) {
  return (
    (typeof newChild === "string" && newChild !== "") ||
    typeof newChild === "number"
  );
}