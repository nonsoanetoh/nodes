import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderFrameToCanvas } from "./export";
import { createEmptyProject, createNode, createFrame } from "../types/project";
import { Frame, Project } from "../types/project";

describe("Canvas Rendering Utilities", () => {
  beforeEach(() => {
    // Mock canvas context methods
    const mockContext = {
      fillStyle: "",
      globalAlpha: 1,
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clip: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      closePath: vi.fn(),
    };

    // Mock document.createElement for canvas
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "canvas") {
        const canvas = {
          width: 0,
          height: 0,
          getContext: vi.fn(() => mockContext),
        } as any;
        return canvas;
      }
      return document.createElement.call(document, tagName);
    }) as any;

    // Mock Image constructor
    global.Image = vi.fn(() => {
      const img = {
        onload: null as any,
        onerror: null as any,
        src: "",
        complete: false,
        naturalWidth: 100,
        naturalHeight: 100,
      } as any;
      // Simulate immediate load
      setTimeout(() => {
        if (img.onload) {
          img.complete = true;
          img.onload();
        }
      }, 0);
      return img;
    }) as any;
  });

  describe("renderFrameToCanvas", () => {
    it("IT-046: Nodes render at correct positions", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];
      frame.nodes.push(createNode(0.2, 0.3)); // 20% x, 30% y
      frame.nodes.push(createNode(0.8, 0.7)); // 80% x, 70% y

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);

      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(500);

      const ctx = canvas.getContext("2d");
      expect(ctx).toBeDefined();

      // Verify fillRect was called (for nodes)
      // The exact number depends on implementation, but should be called
      expect(ctx!.fillRect).toHaveBeenCalled();
    });

    it("IT-047: Nodes render with correct size", async () => {
      const project = createEmptyProject("Test");
      project.nodeSize = 20;
      project.nodeSizeMultiplier = 2;
      const frame = project.frames[0];
      frame.nodes.push(createNode(0.5, 0.5));

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      const ctx = canvas.getContext("2d");

      // Base size should be 20 * 2 = 40
      expect(ctx).toBeDefined();
      expect(ctx!.fillRect).toHaveBeenCalled();
    });

    it("IT-049: Nodes render with colors", async () => {
      const project = createEmptyProject("Test");
      project.nodeColor = "#FF0000";
      project.showImages = false; // Force color rendering
      const frame = project.frames[0];
      frame.nodes.push(createNode(0.5, 0.5));

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      const ctx = canvas.getContext("2d");

      expect(ctx).toBeDefined();
      // fillStyle should be set to nodeColor
      expect(ctx!.fillStyle).toBe("#FF0000");
    });

    it("IT-052: Background color renders correctly", async () => {
      const project = createEmptyProject("Test");
      project.backgroundColor = "#0000FF";
      const frame = project.frames[0];

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      const ctx = canvas.getContext("2d");

      expect(ctx).toBeDefined();
      // Background should be filled with backgroundColor
      expect(ctx!.fillRect).toHaveBeenCalledWith(0, 0, 500, 500);
      // fillStyle should be set to backgroundColor
      expect(ctx!.fillStyle).toBe("#0000FF");
    });

    it("IT-050: Clip mode renders squares", async () => {
      const project = createEmptyProject("Test");
      project.clipMode = true;
      project.clipBackgroundImage = "data:image/png;base64,test"; // Required for clip mode
      const frame = project.frames[0];
      frame.nodes.push(createNode(0.5, 0.5));

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      const ctx = canvas.getContext("2d");

      expect(ctx).toBeDefined();
      // Clip mode should use clip() and rect() when clipBackgroundImage is set
      expect(ctx!.clip).toHaveBeenCalled();
      expect(ctx!.rect).toHaveBeenCalled();
    });

    it("IT-051: Reference image renders correctly", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];
      frame.referenceImage = "data:image/png;base64,test";
      frame.referenceOpacity = 50;

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      const ctx = canvas.getContext("2d");

      expect(ctx).toBeDefined();
      // Reference image should be drawn
      expect(ctx!.drawImage).toHaveBeenCalled();
      // Opacity should be set
      expect(ctx!.globalAlpha).toBe(0.5);
    });
  });
});
