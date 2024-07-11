import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import { FiberRoot } from "./ReactInternalTypes";
import { NormalPriority, Scheduler } from "scheduler";

export const ensureRootIsScheduled = (root: FiberRoot) => {
  queueMicrotask(() => {
    scheduleTaskForRootDuringMicrotask(root);
  });
}

const scheduleTaskForRootDuringMicrotask = (root: FiberRoot) => {
  const schedulerPriorityLevel = NormalPriority;
  Scheduler.scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}