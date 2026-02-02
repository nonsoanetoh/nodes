/**
 * Example Test File
 *
 * This is a simple example test to verify the testing setup is working.
 * Run: npm test
 */

import { describe, it, expect } from "vitest";
import {
  createEmptyProject,
  createNode,
  createFrame,
} from "../app/types/project";

describe("Example Tests", () => {
  it("should create an empty project", () => {
    const project = createEmptyProject();

    expect(project.name).toBe("Untitled");
    expect(project.frames).toHaveLength(5);
  });

  it("should create a node", () => {
    const node = createNode(100, 200);

    expect(node.x).toBe(100);
    expect(node.y).toBe(200);
    expect(node.id).toBeDefined();
  });

  it("should create a frame", () => {
    const frame = createFrame();

    expect(frame.nodes).toEqual([]);
    expect(frame.referenceOpacity).toBe(100);
  });
});
