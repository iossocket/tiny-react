import { createWorkInProgress } from "./ReactFiber";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { Fiber, FiberRoot } from "./ReactInternalTypes";

type ExecutionContext = number;
export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export const scheduleUpdateOnFiber = (root: FiberRoot, fiber: Fiber) => {
  workInProgressRoot = root;
  workInProgress = fiber;

  ensureRootIsScheduled(root);
};

export const performConcurrentWorkOnRoot = (root: FiberRoot) => {
  // 1. render, setup fiber tree VDOM
  renderRootSync(root);
  // 2. commit, VDOM -> DOM
  // commitRoot(root);
}

function renderRootSync(root: FiberRoot) {
  const prevExecutionContext = executionContext;
  // 1. start to render
  executionContext != RenderContext;
  // !2. init
  prepareFreshStack(root);
  // !3. iterate setup fiber tree
  // !4. rend done
  executionContext = prevExecutionContext;
}

function prepareFreshStack(root: FiberRoot): Fiber {
  root.finishedWork = null; // the work need to commit, the work comes from workInProgress
  workInProgressRoot = root; // FiberRoot
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress; // Fiber
  return rootWorkInProgress;
}