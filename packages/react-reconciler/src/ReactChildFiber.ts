import type { ReactElement } from "shared/ReactTypes";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { isArray } from "shared/utils";
import { HostText } from "./ReactWorkTags";

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler = createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

function createChildReconciler(shouldTrackSideEffects: boolean) {
  function deleteChild(returnFiber: Fiber, deletingFiber: Fiber) {
    if (!shouldTrackSideEffects) {
      return;
    }

    if (returnFiber.deletions === null) {
      returnFiber.deletions = [deletingFiber];
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions.push(deletingFiber);
    }
  }

  function deleteRemainingChildren(returnFiber: Fiber, frontDeletingFiber: Fiber) {
    if (!shouldTrackSideEffects) {
      return;
    }

    let currentFiber = frontDeletingFiber;
    while (currentFiber !== null) {
      deleteChild(returnFiber, currentFiber);
      currentFiber = currentFiber.sibling;
    }
    return null;
  }

  function placeSingleChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
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

  function useFiber(fiber: Fiber, pendingProps: any): Fiber {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
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
        } else {
          // can not exist nodes with same key in the same tree level
          deleteRemainingChildren(returnFiber, child);
        }
        break;
      } else {
        // delete single child
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    const created = createFiberFromElement(element);
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

  // apply the new textContent to 'current' fiber
  function updateTextNode(
    returnFiber: Fiber,
    current: Fiber | null,
    textContent: string
  ) {
    if (current === null || current.tag !== HostText) {
      // old text is not text node
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement
  ) {
    const elementType = element.type;
    if (current !== null) {
      if (current.elementType === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: any
  ) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (isText(newChild)) {
      // key from old fiber, if old fiber has key, that means the old is not text node
      if (key !== null) {
        // new node is text node, old node is not text node
        return null;
      }
      // create or reuse the text node
      return updateTextNode(returnFiber, oldFiber, newChild + "");
    }
    if (typeof newChild === "object" && newChild !== null) {
      if (newChild.key === key) {
        return updateElement(returnFiber, oldFiber, newChild);
      } else {
        return null;
      }
    }
  }

  function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number, // hold the position of new fiber in list of older fibers list
    newIndex: number
  ) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // 0 1 2
        // 0 2 1
        // need to change position
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      // newly increased
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: any
  ) {
    let resultFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;
    let oldFiber = currentFirstChild;
    let nextOldFiber: Fiber | null = null;
    let newIdx = 0;
    let lastPlacedIndex = 0;

    // !1.  From left to right, compare fiber at same position of current linked list, exit when the fiber can not be reused
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }

      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }

      // component updating phrase
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber?.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      // check relative position of node changed in DOM structure
      // during updating phase, need to check whether the relative position of node changed or not
      // if changed, movement happened here
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        resultFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;

      oldFiber = nextOldFiber;
    }

    // !2.1 After comparation to the end of new fiber linked list, there are some fibers left in old fiber linked list, delete them
    if (newIdx === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultFirstChild;
    }
    // !2.2 After comparation to the end of old fiber linked list, there are some fibers left in new fiber linked list, create them, the behaviour is same as rendering for the very first time
    // mount at first time
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          resultFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultFirstChild;
    }

    // !3. After comparation, there are fibers left in new fiber linked list and old fiber linked list.
    // TODO
    return resultFirstChild;
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
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
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