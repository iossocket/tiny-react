import { ReactNodeList } from "shared/ReactTypes";
import { FiberRoot } from "./ReactInternalTypes";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  const current = container.current;
  current.memoizedState = { element };


  console.log('%c [  ]-9', 'font-size:13px; background:pink; color:#bf2c9f;', current);

  // scheduleUpdateOnFiber();
}
