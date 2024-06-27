import { peak, pop, push } from "./SchedulerMinHeap";
import { lowPriorityTimeout, maxSigned31BitInt, normalPriorityTimeout, userBlockingPriorityTimeout } from "./SchedulerFeatureFlags";
import {
  PriorityLevel,
  NoPriority,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority
} from "./SchedulerPriorities";

type Callback = (arg: boolean) => Callback | null | undefined;

export type Task = {
  id: number;
  callback: Callback | null;
  priorityLevel: PriorityLevel;
  startTime: number;
  expirationTime: number;
  sortIndex: number;
};

const taskQueue: Array<Task> = [];

let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NoPriority;

let taskIdCounter = 1;
let startTime = -1;
let frameInterval = 5;

// to check any work is running
let isPerformingWork = false;
// to check whether main thread is scheduling
let isHostCallbackScheduled = false;
// to check any async task is running
let isMessageLoopRunning = false;

function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {
  const startTime = getCurrentTime();
  let timeout: number;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = -1;
      break;
    case UserBlockingPriority:
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      timeout = maxSigned31BitInt;
      break;
    case LowPriority:
      timeout = lowPriorityTimeout;
      break;
    case NormalPriority:
    default:
      timeout = normalPriorityTimeout;
      break;
  }

  const expirationTime = timeout + timeout;
  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1
  };

  newTask.sortIndex = expirationTime;
  push(taskQueue, newTask);

  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback();
  }
}

function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function performWorkUntilDeadline() {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();
    startTime = currentTime;
    let hasMoreWork = true;
    try {
      hasMoreWork = flushWork(currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
      }
    }
  }
}

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;
function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}

function flushWork(initialTime: number) {
  isHostCallbackScheduled = false;
  isPerformingWork = true;
  let previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

function getCurrentTime() {
  return performance.now();
}

function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}

function workLoop(initialTime: number) {
  let currentTime = initialTime;
  currentTask = peak(taskQueue);

  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }

    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;

      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);

      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        return true;
      } else {
        if (currentTask === peak(taskQueue)) {
          pop(taskQueue);
        }
      }
    } else {
      pop(taskQueue);
    }

    currentTask = peak(taskQueue);
  }

  if (currentTask !== null) {
    return true;
  } else {
    return false;
  }
}