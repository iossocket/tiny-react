import { ReactNodeList } from "shared/ReactTypes";
import { FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  const current = container.current;
  current.memoizedState = { element };
  const root = container;
  scheduleUpdateOnFiber(root, current);
}
