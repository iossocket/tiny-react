import type { DOMEventName } from "./DOMEventNames";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";

SimpleEventPlugin.registerEvents();

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
  // 为了减少字节数，我们将上述媒体事件数组插入到这个 Set 中。
  // 注意："error" 事件并不是一个独占的媒体事件，也可能发生在其他元素上。我们不会重复这个事件，而是直接从媒体事件数组中取出。
  ...mediaEventTypes,
]);

export function listenToAllSupportedEvents(container: any) { }