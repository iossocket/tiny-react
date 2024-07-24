import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";

type ExecutionContext = number;
export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  ensureRootIsScheduled(root); // schedule a task to run performConcurrentWorkOnRoot()
};

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  // 1. render, setup fiber tree VDOM (beginWork|completeWork)
  renderRootSync(root);
  console.log('%c [ renderRootSync ]-29', 'font-size:13px; background:pink; color:#bf2c9f;', root);
  // 2. commit, VDOM -> DOM
  const finishedWork = root.current.alternate; // alternate is fiber tree which has been rendered in memory as vdom
  root.finishedWork = finishedWork;
  commitRoot(root);
}

function renderRootSync(root: FiberRoot) {
  const prevExecutionContext = executionContext;
  // !1. start to render
  executionContext != RenderContext;
  // !2. init
  prepareFreshStack(root);
  // !3. iterate setup fiber tree
  workLoopSync();
  // !4. render done
  executionContext = prevExecutionContext;
  workInProgressRoot = null;
}

function commitRoot(root: FiberRoot) {
  const prevExecutionContext = executionContext;
  // !1. start to commit
  executionContext != CommitContext;

  // !2. mutation phase, render DOM tree
  // root.finishedWork is type of Fiber with tag HostRoot(3)
  const finishedWork = root.finishedWork as Fiber;
  commitMutationEffects(root, finishedWork);

  // !3. commit done
  executionContext = prevExecutionContext;
  workInProgressRoot = null;
}

function prepareFreshStack(root: FiberRoot): Fiber {
  root.finishedWork = null; // the work need to commit, the work comes from workInProgress
  workInProgressRoot = root; // FiberRoot
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress; // Fiber
  return rootWorkInProgress;
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber) {
  const current = unitOfWork.alternate;
  // 1. beginWork
  let next = beginWork(current, unitOfWork);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
  // 2. completeWork
}

// DFS
function completeUnitOfWork(unitOfWork: Fiber) {
  let completedWork: Fiber | null = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    let next = completeWork(current, completedWork);

    if (next !== null) {
      workInProgress = next;
      return;
    }

    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    completedWork = returnFiber as Fiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}