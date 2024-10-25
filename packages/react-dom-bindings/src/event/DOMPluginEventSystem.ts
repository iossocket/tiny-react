import { Fiber } from "react-reconciler/src/ReactInternalTypes";
import type { DOMEventName } from "./DOMEventNames";
import { addEventBubbleListener, addEventCaptureListener } from "./EventListener";
import { allNativeEvents } from "./EventRegistry";
import { EventSystemFlags, IS_CAPTURE_PHASE, SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS } from "./EventSystemFlags";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import * as ChangeEventPlugin from "./plugins/ChangeEventPlugin";
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener";
import { HostComponent } from "react-reconciler/src/ReactWorkTags";
import getListener from "./getListener";
import { ReactSyntheticEvent } from "./ReactSyntheticEventType";

export type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | TouchEvent;

export type DispatchListener = {
  instance: null | Fiber;
  listener: Function;
  currentTarget: EventTarget;
}

type DispatchEntry = {
  event: ReactSyntheticEvent;
  listeners: Array<DispatchListener>;
}

export type DispatchQueue = Array<DispatchEntry>;

SimpleEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();


export function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );

  if ((eventSystemFlags & SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS) === 0) {
    ChangeEventPlugin.extractEvents(
      dispatchQueue,
      domEventName,
      targetInst,
      nativeEvent,
      nativeEventTarget,
      eventSystemFlags,
      targetContainer,
    );
  }
}

export const mediaEventTypes: Array<DOMEventName> = [
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "encrypted",
  "ended",
  "error",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "resize",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
];

// we should not delegate these events to container
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
  "cancel",
  "close",
  "invalid",
  "load",
  "scroll",
  "scrollend",
  "toggle",
  // In order to reduce bytes, we insert the above array of media events
  // into this Set. Note: the "error" event isn't an exclusive media event,
  // and can occur on other elements too. Rather than duplicate that event,
  // we just take it from the media events array.
  ...mediaEventTypes,
]);

const listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    allNativeEvents.forEach((domEventName) => {
      if (domEventName !== "selectionchange") {
        // bubbling & capture
        if (!nonDelegatedEvents.has(domEventName)) {
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    })
  }
}

function listenToNativeEvent(domEventName: DOMEventName, isCapturePhaseListener: boolean, target: EventTarget) {
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

function addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean
) {
  // 1. get event, which is defined in ReactDOMEventListener
  let listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  )

  let isPassiveListener: boolean = false;
  if (domEventName === "touchstart" || domEventName === "touchmove" || domEventName === "wheel") {
    isPassiveListener = true;
  }

  // 2. binding events
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener, isPassiveListener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener, isPassiveListener);
  }
}

export function accumulateSinglePhaseListeners(
  targetFiber: Fiber | null,
  reactName: string | null,
  nativeEventType: string,
  inCapturePhase: boolean,
  accumulateTargetOnly: boolean,
  nativeEvent: AnyNativeEvent
): Array<DispatchListener> {
  const captureName = reactName !== null ? reactName + "Capture" : null;
  const reactEventName = inCapturePhase ? captureName : reactName;
  let listeners: Array<DispatchListener> = [];

  let instance = targetFiber;

  // from target -> root, accumulate all the fiber and listeners
  while (instance !== null) {
    const { stateNode, tag } = instance;
    // handle the listeners of HostComponents
    if (tag === HostComponent && stateNode !== null) {
      // standard React on* listeners, i.e. onClick or onClickCapture
      const listener = getListener(instance, reactEventName as string);
      if (listener != null) {
        listeners.push({
          instance,
          listener,
          currentTarget: stateNode,
        });
      }
    }
    // if only for target, we don't need to to propagate to find other listeners by React Fiber
    if (accumulateTargetOnly) {
      break;
    }

    instance = instance.return;
  }
  return listeners;
}

export function accumulateTwoPhaseListeners(
  targetFiber: Fiber | null,
  reactName: string | null
): Array<DispatchListener> {
  const captureName = reactName !== null ? reactName + "Capture" : null;
  let listeners: Array<DispatchListener> = [];

  let instance = targetFiber;

  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      const captureListener = getListener(instance, captureName as string);
      if (captureListener != null) {
        // capture
        listeners.unshift({
          instance,
          listener: captureListener,
          currentTarget: stateNode,
        });
      }
      // bubble
      const bubbleListener = getListener(instance, reactName as string);
      if (bubbleListener != null) {
        listeners.unshift({
          instance,
          listener: bubbleListener,
          currentTarget: stateNode,
        });
      }
    }
    instance = instance.return;
  }

  return listeners;
}
