import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import { FiberRoot } from "./ReactInternalTypes";
import { NormalPriority, Scheduler } from "scheduler";

export const ensureRootIsScheduled = (root: FiberRoot) => {
  queueMicrotask(() => {
    scheduleTaskForRootDuringMicrotask(root);
  });
}

const scheduleTaskForRootDuringMicrotask = (root: FiberRoot) => {
  Scheduler.scheduleCallback(NormalPriority, performConcurrentWorkOnRoot.bind(null, root))
}