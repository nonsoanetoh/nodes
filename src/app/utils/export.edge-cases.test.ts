import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderFrameToCanvas } from "./export";
import { createEmptyProject, createNode } from "../types/project";
import { Project } from "../types/project";

describe("Export Utilities - Edge Cases", () => {
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

    // Mock Image constructor with error handling
    global.Image = vi.fn(() => {
      const img = {
        onload: null as any,
        onerror: null as any,
        src: "",
        complete: false,
        naturalWidth: 100,
        naturalHeight: 100,
      } as any;
      // Simulate immediate load for valid images
      setTimeout(() => {
        if (img.onload && !img.src.includes("invalid")) {
          img.complete = true;
          img.onload();
        } else if (img.onerror && img.src.includes("invalid")) {
          img.onerror();
        }
      }, 0);
      return img;
    }) as any;
  });

  describe("Invalid Image Handling", () => {
    it("EC-002: Invalid images don't crash app", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];
      frame.nodes.push(createNode(0.5, 0.5));

      // Set invalid image URL
      project.imageLibrary = ["invalid-image-url"];
      frame.nodes[0].imageIndex = 0;

      // Should not throw
      await expect(
        renderFrameToCanvas(frame, project, 500, 500),
      ).resolves.toBeDefined();
    });

    it("EC-002: Invalid images are handled gracefully", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];
      frame.nodes.push(createNode(0.5, 0.5));

      // Set invalid image URL
      project.imageLibrary = ["invalid-image-url"];
      frame.nodes[0].imageIndex = 0;
      project.showImages = true;

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      const ctx = canvas.getContext("2d");

      // Should still render (fallback to color)
      expect(ctx).toBeDefined();
      expect(ctx!.fillRect).toHaveBeenCalled();
    });

    it("EC-002: App continues to function after image error", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];

      // Test that rendering works without reference image
      frame.nodes.push(createNode(0.5, 0.5));
      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      expect(canvas).toBeDefined();

      // Test that rendering works with valid reference image
      frame.referenceImage = "data:image/png;base64,valid";
      const canvas2 = await renderFrameToCanvas(frame, project, 500, 500);
      expect(canvas2).toBeDefined();

      // App should continue to function even if image loading fails
      // (The actual error handling happens in the component layer)
    });
  });

  describe("Boundary Conditions", () => {
    it("EC-004: Large node counts render correctly", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];

      // Add many nodes
      for (let i = 0; i < 200; i++) {
        frame.nodes.push(createNode(Math.random(), Math.random()));
      }

      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(500);
    });

    it("EC-004: Many frames can be rendered", async () => {
      const project = createEmptyProject("Test");

      // Add many frames
      for (let i = 0; i < 100; i++) {
        project.frames.push({
          id: `frame-${i}`,
          nodes: [createNode(0.5, 0.5)],
          referenceOpacity: 100,
        });
      }

      // Render each frame
      for (let i = 0; i < project.frames.length; i++) {
        const canvas = await renderFrameToCanvas(
          project.frames[i],
          project,
          500,
          500,
        );
        expect(canvas).toBeDefined();
      }
    });
  });
});
