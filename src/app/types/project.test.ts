import { describe, it, expect } from "vitest";
import {
  createEmptyProject,
  createNode,
  createFrame,
  type Project,
} from "./project";

describe("Project Types", () => {
  describe("createEmptyProject", () => {
    it("UT-001: creates project with default values", () => {
      const project = createEmptyProject();

      expect(project.name).toBe("Untitled");
      expect(project.canvasSize).toEqual([500, 500]);
      expect(project.nodeSize).toBe(40);
      expect(project.drawMode).toBe("Freehand");
      expect(project.frames).toHaveLength(5);
      expect(project.backgroundColor).toBe("#E5E5E5");
      expect(project.nodeColor).toBe("#555555");
      expect(project.freehandSpacing).toBe(20);
      expect(project.imageShuffleType).toBe("Duplicate Repeats");
      expect(project.imageLibrary).toEqual([]);
      expect(project.currentFrameIndex).toBe(0);
      expect(project.animationSpeed).toBe(12);
      expect(project.isPlaying).toBe(false);
      expect(project.exportQualityGIF).toBe(10);
      expect(project.exportQualityVideo).toBe(0.8);
      expect(project.showImages).toBe(true);
      expect(project.clipMode).toBe(false);
    });

    it("UT-002: accepts custom name", () => {
      const project = createEmptyProject("My Project");

      expect(project.name).toBe("My Project");
    });

    it("UT-002: empty string defaults to Untitled", () => {
      const project = createEmptyProject("");

      expect(project.name).toBe("Untitled");
    });
  });

  describe("createNode", () => {
    it("UT-006: creates node with correct properties", () => {
      const node = createNode(100, 200, "test-id", 1.5, 0);

      expect(node.x).toBe(100);
      expect(node.y).toBe(200);
      expect(node.id).toBe("test-id");
      expect(node.size).toBe(1.5);
      expect(node.imageIndex).toBe(0);
    });

    it("UT-006: generates unique ID when not provided", () => {
      const node1 = createNode(0, 0);
      const node2 = createNode(0, 0);

      expect(node1.id).toBeDefined();
      expect(node2.id).toBeDefined();
      expect(node1.id).not.toBe(node2.id);
    });

    it("UT-006: defaults size to 1.0 when not provided", () => {
      const node = createNode(0, 0);

      expect(node.size).toBe(1.0);
    });
  });

  describe("createFrame", () => {
    it("UT-011: creates frame with defaults", () => {
      const frame = createFrame();

      expect(frame.id).toBeDefined();
      expect(frame.nodes).toEqual([]);
      expect(frame.referenceOpacity).toBe(100);
    });

    it("UT-011: accepts custom ID", () => {
      const frame = createFrame("custom-id");

      expect(frame.id).toBe("custom-id");
    });

    it("UT-011: generates unique ID when not provided", () => {
      const frame1 = createFrame();
      const frame2 = createFrame();

      expect(frame1.id).toBeDefined();
      expect(frame2.id).toBeDefined();
      expect(frame1.id).not.toBe(frame2.id);
    });
  });
});
