import { ReactNodeList } from "shared/ReactTypes";
import { FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

/**
 * 
 * @param element ui component need to be rendered in render method
 * @param container type is FiberRoot
 */
export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  // container.current is uninitialized fiber(tag is HostRoot)
  const current = container.current;
  current.memoizedState = { element };
  const root = container;
  scheduleUpdateOnFiber(root, current);
}
