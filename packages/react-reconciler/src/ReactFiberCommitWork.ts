import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

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

function commitPlacement(finishedWork: Fiber) {
  if (finishedWork.stateNode && (finishedWork.tag === HostComponent || finishedWork.tag === HostText)) {
    const parentFiber = getHostParentFiber(finishedWork);
    let parentDom = parentFiber.stateNode;
    if (parentDom.containerInfo) {
      parentDom = parentDom.containerInfo;
    }
    parentDom.appendChild(finishedWork.stateNode);
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