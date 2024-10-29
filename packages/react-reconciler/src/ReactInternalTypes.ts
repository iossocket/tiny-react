import { Flags } from "./ReactFiberFlags";
import { Lanes } from "./ReactFiberLane";
import { WorkTag } from "./ReactWorkTags";

export type Fiber = {
  // describe component type, native tag / functional component / class component
  tag: WorkTag;

  key: null | string;

  elementType: any;

  type: any;

  stateNode: any;
  // parent fiber
  return: Fiber | null;

  child: Fiber | null;

  sibling: Fiber | null;

  index: number;

  // new props
  pendingProps: any;
  // used for last rendering
  memoizedProps: any;

  memoizedState: any;

  flags: Flags;

  alternate: Fiber | null;

  // the fibers need to be deleted
  deletions: Array<Fiber> | null;

  updateQueue: any;

  lanes: Lanes;
  childLanes: Lanes;
}

export type Container = Element | Document | DocumentFragment;

export type FiberRoot = {
  containerInfo: Container;
  current: Fiber;
  finishedWork: Fiber | null;
  pendingLanes: Lanes;
};