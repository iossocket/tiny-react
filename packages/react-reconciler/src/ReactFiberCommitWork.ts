import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Passive, Placement, Update } from "./ReactFiberFlags";
import { HookFlags, HookLayout, HookPassive } from "./ReactHookEffectTags";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child = parentFiber.child;
  while (child !== null) {
    commitMutationEffects(root, child);
    child = child.sibling;
  }
}

function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;

  if (flags & Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }

  if (flags & ChildDeletion) {
    const parentFiber = isHostParent(finishedWork) ? finishedWork : getHostParentFiber(finishedWork);
    const parentDOM = parentFiber.stateNode;
    commitDeletions(finishedWork.deletions, parentDOM);

    finishedWork.flags &= ~ChildDeletion;
    finishedWork.deletions = null;
  }

  if (flags & Update) {
    if (finishedWork.tag === FunctionComponent) {
      commitHookEffectListMount(HookLayout, finishedWork);
      finishedWork.flags &= ~Update;
    }
  }
}

function commitHookEffectListMount(hookFlags: HookFlags, finishedWork: Fiber) {
  const updateQueue = finishedWork.updateQueue;
  let lastEffect = updateQueue!.lastEffect;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & hookFlags) === hookFlags) {
        const create = effect.create;
        create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function commitDeletions(deletions: Array<Fiber>, parentDOM: Element | Document | DocumentFragment) {
  deletions.forEach(deletion => {
    parentDOM.removeChild(getStateNode(deletion));
  });
}

function getStateNode(fiber: Fiber) {
  let node = fiber;
  while (true) {
    if (isHost(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child as Fiber;
  }
}

function getHostSibling(fiber: Fiber) {
  let node = fiber;
  sibling: while (1) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    // todo
    node = node.sibling;
    while (!isHost(node)) {
      if (node.flags & Placement) {
        continue sibling;
      }
      if (node.child === null) {
        continue sibling;
      } else {
        node = node.child;
      }
    }

    // HostComponent|HostText
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element
) {
  if (before) {
    parent.insertBefore(getStateNode(node), before);
  } else {
    parent.appendChild(getStateNode(node));
  }
}

function commitPlacement(finishedWork: Fiber) {
  if (finishedWork.stateNode && (finishedWork.tag === HostComponent || finishedWork.tag === HostText)) {
    const parentFiber = getHostParentFiber(finishedWork);
    let parentDom = parentFiber.stateNode;
    if (parentDom.containerInfo) {
      parentDom = parentDom.containerInfo;
    }
    const before = getHostSibling(finishedWork);
    insertOrAppendPlacementNode(finishedWork, before, parentDom);
  } else {
    let child = finishedWork.child;
    while (child !== null) {
      commitPlacement(child);
      child = child.sibling;
    }
  }
}

function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
  throw new Error(
    "Expected to find a host parent. This error is likely caused by a bug " +
    "in React. Please file an issue."
  );
}

function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

export function flushPassiveEffects(finishedWork: Fiber) {
  // !1. traverse all children
  recursivelyTraversePassiveMountEffects(finishedWork);
  // !2. execute passive effects if found
  commitPassiveEffects(finishedWork);
}

function recursivelyTraversePassiveMountEffects(finishedWork: Fiber) {
  let child = finishedWork.child;
  while (child !== null) {
    // !1. traverse all children
    recursivelyTraversePassiveMountEffects(child);
    // !2. execute passive effects if found
    commitPassiveEffects(finishedWork);
    child = child.sibling;
  }
}

function commitPassiveEffects(finishedWork: Fiber) {
  switch (finishedWork.tag) {
    case FunctionComponent: {
      if (finishedWork.flags & Passive) {
        commitHookEffectListMount(HookPassive, finishedWork);
        finishedWork.flags &= ~Passive;
      }
      break;
    }
  }
}