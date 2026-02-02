import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";
import { createEmptyProject, createNode, createFrame } from "../types/project";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - Edge Cases & Error Handling", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Invalid Input", () => {
    it("EC-001: Invalid project import throws error for invalid JSON", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Test invalid JSON structure (not an object)
      expect(() => {
        act(() => {
          result.current.importProject("invalid json" as any);
        });
      }).toThrow("Invalid project format");

      // Test null
      expect(() => {
        act(() => {
          result.current.importProject(null as any);
        });
      }).toThrow("Invalid project format");

      // Test undefined
      expect(() => {
        act(() => {
          result.current.importProject(undefined as any);
        });
      }).toThrow("Invalid project format");
    });

    it("EC-001: Invalid project import throws error for missing fields", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Test missing frames array
      expect(() => {
        act(() => {
          result.current.importProject({ name: "Test" } as any);
        });
      }).toThrow("Invalid project format");

      // Test frames not an array
      expect(() => {
        act(() => {
          result.current.importProject({ frames: "not an array" } as any);
        });
      }).toThrow("Invalid project format");
    });

    it("EC-001: Invalid project import doesn't crash app", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // App should still function after error
      expect(() => {
        try {
          act(() => {
            result.current.importProject({} as any);
          });
        } catch (error) {
          // Expected error
        }
      }).not.toThrow();

      // App should still have a valid project
      expect(result.current.project).toBeDefined();
      expect(Array.isArray(result.current.project.frames)).toBe(true);
    });
  });

  describe("Boundary Conditions", () => {
    it("EC-003: Empty project handles correctly - no nodes", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;
      const frame = result.current.project.frames[frameIndex];

      // Frame should exist even with no nodes
      expect(frame).toBeDefined();
      expect(Array.isArray(frame.nodes)).toBe(true);
      expect(frame.nodes.length).toBe(0);

      // Should be able to add nodes
      act(() => {
        result.current.addNode(frameIndex, 0.5, 0.5);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames[frameIndex].nodes.length).toBe(1);
    });

    it("EC-003: Empty project handles correctly - no frames", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Project should always have at least one frame
      expect(result.current.project.frames.length).toBeGreaterThan(0);

      // Should be able to add frames
      const initialFrameCount = result.current.project.frames.length;
      act(() => {
        result.current.addFrame();
      });

      expect(result.current.project.frames.length).toBe(initialFrameCount + 1);
    });

    it("EC-003: Empty project handles correctly - empty image library", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Empty image library should work
      expect(Array.isArray(result.current.project.imageLibrary)).toBe(true);
      expect(result.current.project.imageLibrary.length).toBe(0);

      // Should be able to add nodes without images
      const frameIndex = result.current.project.currentFrameIndex;
      act(() => {
        result.current.addNode(frameIndex, 0.5, 0.5);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const node = result.current.project.frames[frameIndex].nodes[0];
      expect(node).toBeDefined();
      // Node should work without imageIndex
      expect(node.imageIndex).toBeUndefined();
    });

    it("EC-004: Maximum values are handled - large node counts", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add many nodes
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.addNode(frameIndex, Math.random(), Math.random());
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.project.frames[frameIndex].nodes.length).toBe(100);
    });

    it("EC-004: Maximum values are handled - many frames", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialFrameCount = result.current.project.frames.length;

      // Add many frames
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.addFrame();
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.project.frames.length).toBe(initialFrameCount + 50);
    });

    it("EC-004: Maximum values are handled - large images", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create a large data URL (simulating large image)
      const largeDataUrl = "data:image/png;base64," + "A".repeat(1000000);

      act(() => {
        result.current.updateSettings({
          imageLibrary: [largeDataUrl],
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.imageLibrary.length).toBe(1);
      expect(result.current.project.imageLibrary[0]).toBe(largeDataUrl);
    });
  });

  describe("State Consistency", () => {
    it("EC-005: State remains consistent - no orphaned nodes", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add nodes
      act(() => {
        result.current.addNode(frameIndex, 0.1, 0.1);
        result.current.addNode(frameIndex, 0.2, 0.2);
        result.current.addNode(frameIndex, 0.3, 0.3);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const nodeCount = result.current.project.frames[frameIndex].nodes.length;

      // Remove a node
      const nodeToRemove = result.current.project.frames[frameIndex].nodes[0];
      act(() => {
        result.current.removeNode(frameIndex, nodeToRemove.id);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Node count should decrease
      expect(result.current.project.frames[frameIndex].nodes.length).toBe(
        nodeCount - 1,
      );

      // Remaining nodes should be valid
      result.current.project.frames[frameIndex].nodes.forEach((node) => {
        expect(node.id).toBeDefined();
        expect(typeof node.x).toBe("number");
        expect(typeof node.y).toBe("number");
      });
    });

    it("EC-005: State remains consistent - no invalid frame indices", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameCount = result.current.project.frames.length;

      // Set valid frame indices
      act(() => {
        result.current.setCurrentFrame(0);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.currentFrameIndex).toBe(0);

      // Set to last valid frame
      act(() => {
        result.current.setCurrentFrame(frameCount - 1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const currentIndex = result.current.project.currentFrameIndex;
      expect(currentIndex).toBeGreaterThanOrEqual(0);
      expect(currentIndex).toBeLessThan(frameCount);
    });

    it("EC-005: State remains consistent - no invalid image indices", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add image library
      act(() => {
        result.current.updateSettings({
          imageLibrary: ["image1", "image2", "image3"],
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add node with valid image index
      act(() => {
        result.current.addNode(frameIndex, 0.5, 0.5);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const node = result.current.project.frames[frameIndex].nodes[0];

      // If node has imageIndex, it should be valid
      if (node.imageIndex !== undefined) {
        expect(node.imageIndex).toBeGreaterThanOrEqual(0);
        expect(node.imageIndex).toBeLessThan(
          result.current.project.imageLibrary.length,
        );
      }
    });

    it("EC-005: State remains consistent after frame removal", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add multiple frames
      act(() => {
        result.current.addFrame();
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameCount = result.current.project.frames.length;
      const currentIndex = result.current.project.currentFrameIndex;

      // Remove a frame
      act(() => {
        result.current.removeFrame(0);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Frame count should decrease
      expect(result.current.project.frames.length).toBe(frameCount - 1);

      // Current frame index should be valid
      const newCurrentIndex = result.current.project.currentFrameIndex;
      expect(newCurrentIndex).toBeGreaterThanOrEqual(0);
      expect(newCurrentIndex).toBeLessThan(
        result.current.project.frames.length,
      );
    });
  });
});
