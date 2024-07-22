import { ReactNodeList } from "shared/ReactTypes";
import { FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

/**
 * 
 * @param element ui component need to be rendered in render method
 * @param container type is FiberRoot, runtime global context
 */
export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  // container.current is uninitialized fiber(tag is HostRoot)
  const current = container.current;
  // container.current.memoizedState = { element }
  current.memoizedState = { element };

  // scheduleUpdateOnFiber(container, container.current);
  const root = container;
  scheduleUpdateOnFiber(root, current);
}
