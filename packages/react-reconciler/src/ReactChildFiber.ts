import type { ReactElement } from "shared/ReactTypes";
import { Placement } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import { createFiberFromElement } from "./ReactFiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";

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
    return null;
  }
  return reconcileChildFibers;
}