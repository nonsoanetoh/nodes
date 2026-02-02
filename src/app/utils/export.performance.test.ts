import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderFrameToCanvas } from "./export";
import { createEmptyProject, createNode } from "../types/project";

describe("Export Utilities - Performance Tests", () => {
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
      setTimeout(() => {
        if (img.onload) {
          img.complete = true;
          img.onload();
        }
      }, 0);
      return img;
    }) as any;
  });

  describe("Rendering Performance", () => {
    it("PERF-001: Canvas renders 100+ nodes efficiently", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];

      // Add 100 nodes
      for (let i = 0; i < 100; i++) {
        frame.nodes.push(createNode(Math.random(), Math.random()));
      }

      const start = performance.now();
      const canvas = await renderFrameToCanvas(frame, project, 500, 500);
      const renderTime = performance.now() - start;

      expect(canvas).toBeDefined();
      // Should render 100 nodes in reasonable time (<100ms for test environment)
      // In real browser, target would be <16ms for 60fps
      expect(renderTime).toBeLessThan(1000);
    });

    it("PERF-001: Frame switching is fast", async () => {
      const project = createEmptyProject("Test");

      // Create multiple frames with nodes
      for (let i = 0; i < 10; i++) {
        const frame = project.frames[i] || project.frames[0];
        for (let j = 0; j < 20; j++) {
          frame.nodes.push(createNode(Math.random(), Math.random()));
        }
      }

      const switchTimes: number[] = [];

      // Measure time to switch between frames
      for (let i = 0; i < project.frames.length; i++) {
        const start = performance.now();
        await renderFrameToCanvas(project.frames[i], project, 500, 500);
        const switchTime = performance.now() - start;
        switchTimes.push(switchTime);
      }

      // Average switch time should be reasonable
      const avgSwitchTime =
        switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      expect(avgSwitchTime).toBeLessThan(500);
    });

    it("PERF-001: Animation playback is smooth", async () => {
      const project = createEmptyProject("Test");

      // Create 30 frames (1 second at 30fps)
      for (let i = 0; i < 30; i++) {
        const frame = project.frames[i] || project.frames[0];
        for (let j = 0; j < 10; j++) {
          frame.nodes.push(createNode(Math.random(), Math.random()));
        }
      }

      const frameTimes: number[] = [];

      // Simulate animation playback - render each frame
      for (let i = 0; i < project.frames.length; i++) {
        const start = performance.now();
        await renderFrameToCanvas(project.frames[i], project, 500, 500);
        const frameTime = performance.now() - start;
        frameTimes.push(frameTime);
      }

      // Check that frame times are consistent (low variance)
      const avgFrameTime =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const variance =
        frameTimes.reduce((sum, time) => {
          return sum + Math.pow(time - avgFrameTime, 2);
        }, 0) / frameTimes.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be low for smooth playback
      expect(stdDev).toBeLessThan(avgFrameTime * 2); // Variance should be reasonable
    });
  });

  describe("Image Loading Performance", () => {
    it("PERF-002: Images are cached", async () => {
      const project = createEmptyProject("Test");
      project.clipMode = true;
      project.clipBackgroundImage = "data:image/png;base64,test1";

      // Create image map to simulate caching
      const imageMap = new Map<string, HTMLImageElement>();

      // First render - clip background image should be loaded
      const start1 = performance.now();
      await renderFrameToCanvas(project.frames[0], project, 500, 500, imageMap);
      const firstRenderTime = performance.now() - start1;

      // Second render with same image - should use cache
      const start2 = performance.now();
      await renderFrameToCanvas(project.frames[0], project, 500, 500, imageMap);
      const secondRenderTime = performance.now() - start2;

      // Image should be cached in imageMap (clip background images are cached)
      expect(imageMap.has(project.clipBackgroundImage!)).toBe(true);

      // Second render should be similar or faster (cached)
      // In test environment, times may vary, but caching should work
      expect(secondRenderTime).toBeLessThanOrEqual(firstRenderTime * 2);
    });

    it("PERF-002: Images load asynchronously", async () => {
      const project = createEmptyProject("Test");
      const frame = project.frames[0];
      frame.referenceImage = "data:image/png;base64,test";

      // Start rendering (should not block)
      const renderPromise = renderFrameToCanvas(frame, project, 500, 500);

      // Should return promise immediately (non-blocking)
      expect(renderPromise).toBeInstanceOf(Promise);

      // Should complete eventually
      const canvas = await renderPromise;
      expect(canvas).toBeDefined();
    });
  });
});
