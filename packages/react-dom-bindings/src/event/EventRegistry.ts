import type { DOMEventName } from "./DOMEventNames";

// native events
export const allNativeEvents: Set<DOMEventName> = new Set();

export const registrationNameDependencies: {
  [registrationName: string]: Array<DOMEventName>;
} = {};

export function registerTwoPhaseEvent(
  registrationName: string, // reactName onClick
  dependencies: Array<DOMEventName>
): void {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + "Capture", dependencies);
}

export function registerDirectEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>
) {
  registrationNameDependencies[registrationName] = dependencies;

  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
