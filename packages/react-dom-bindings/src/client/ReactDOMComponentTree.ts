import { Fiber } from "react-reconciler/src/ReactInternalTypes";

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = "__reactFiber$" + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;

export function precacheFiberNode(hostInst: Fiber, node: Element | Text): void {
  node[internalInstanceKey] = hostInst;
}

export function getClosestInstanceFromNode(targetNode: Node): null | Fiber {
  let targetInst = targetNode[internalInstanceKey];
  if (targetInst) {
    // Don't return HostRoot or SuspenseComponent here.
    return targetInst;
  }

  return null;
}

export function getFiberCurrentPropsFromNode(node: Element | Text) {
  return node[internalPropsKey] || null;
}

export function updateFiberProps(node: Element | Text, props: any): void {
  node[internalPropsKey] = props;
}