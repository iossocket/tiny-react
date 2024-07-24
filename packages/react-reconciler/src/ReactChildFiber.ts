import type { ReactElement } from "shared/ReactTypes";
import { Placement } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import { createFiberFromElement } from "./ReactFiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { isArray } from "shared/utils";

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler = createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

function createChildReconciler(shouldTrackSideEffects: boolean) {
  function placeSingleChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: ReactElement
  ) {
    const created = createFiberFromElement(newChild);
    created.return = returnFiber;
    return created;
  }

  function createChild(returnFiber: Fiber, newChild: any) {
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