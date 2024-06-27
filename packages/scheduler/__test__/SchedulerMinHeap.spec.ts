import { describe, expect, it } from "vitest";
import { peak, push, pop, Heap, Node } from "../src/SchedulerMinHeap";

let idCounter = 0;
function createNode(val: number): Node {
  return { id: idCounter, sortIndex: val };
}

describe("test min heap", () => {
  it("should return null when empty", () => {
    const tasks: Heap<Node> = [];
    expect(peak(tasks)).toBe(null);
  });

  it("should return 1 when heap length === 1", () => {
    const tasks: Heap<Node> = [createNode(1)];
    expect(peak(tasks)?.sortIndex).toEqual(1);
  });

  it("should return top element when exec peek", () => {
    const tasks: Heap<Node> = [createNode(1)];
    push(tasks, createNode(2));
    push(tasks, createNode(3));
    expect(peak(tasks)?.sortIndex).toEqual(1);
    push(tasks, createNode(0));
    expect(peak(tasks)?.sortIndex).toEqual(0);
    pop(tasks);
    expect(peak(tasks)?.sortIndex).toEqual(1);
  });
});
