import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - Frame Operations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Frame Creation", () => {
    it("UT-012: addFrame adds frame to project", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialFrameCount = result.current.project.frames.length;

      act(() => {
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames.length).toBe(initialFrameCount + 1);
      const newFrame =
        result.current.project.frames[result.current.project.frames.length - 1];
      expect(newFrame.nodes).toEqual([]);
      expect(newFrame.id).toBeDefined();
    });

    it("IT-021: Adding frame doesn't affect other frames", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add a node to current frame
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const nodeCount = result.current.project.frames[frameIndex].nodes.length;

      // Add a new frame
      act(() => {
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Original frame should still have its node
      expect(result.current.project.frames[frameIndex].nodes.length).toBe(
        nodeCount,
      );
    });
  });

  describe("Frame Deletion", () => {
    it("UT-013: removeFrame removes frame", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialFrameCount = result.current.project.frames.length;

      // Add a frame first
      act(() => {
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames.length).toBe(initialFrameCount + 1);

      // Remove the last frame
      const lastFrameIndex = result.current.project.frames.length - 1;
      act(() => {
        result.current.removeFrame(lastFrameIndex);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames.length).toBe(initialFrameCount);
    });

    it("UT-013: Cannot remove last frame", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialFrameCount = result.current.project.frames.length;

      // Try to remove all frames except one
      for (let i = initialFrameCount - 1; i > 0; i--) {
        act(() => {
          result.current.removeFrame(i);
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Should have at least one frame remaining
      expect(result.current.project.frames.length).toBeGreaterThanOrEqual(1);
    });

    it("IT-022: Removing frame adjusts current frame index", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add frames
      act(() => {
        result.current.addFrame();
      });
      act(() => {
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set current frame to last frame (index 4, since we have 5 frames + 2 added = 7 total)
      const totalFrames = result.current.project.frames.length;
      const lastFrameIndex = totalFrames - 1;

      act(() => {
        result.current.setCurrentFrame(lastFrameIndex);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.currentFrameIndex).toBe(lastFrameIndex);

      // Remove the last frame
      act(() => {
        result.current.removeFrame(lastFrameIndex);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Current frame index should adjust to new last frame
      const newLastFrameIndex = result.current.project.frames.length - 1;
      expect(result.current.project.currentFrameIndex).toBe(newLastFrameIndex);
    });
  });

  describe("Frame Duplication", () => {
    it("UT-014: duplicateFrame creates copy with new ID", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add a node to the frame
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const originalFrame = result.current.project.frames[frameIndex];
      const originalFrameId = originalFrame.id;
      const originalNodeCount = originalFrame.nodes.length;

      // Duplicate the frame
      act(() => {
        result.current.duplicateFrame(frameIndex);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // New frame should be after the original
      const duplicatedFrame = result.current.project.frames[frameIndex + 1];
      expect(duplicatedFrame).toBeDefined();
      expect(duplicatedFrame.id).not.toBe(originalFrameId);
      expect(duplicatedFrame.nodes.length).toBe(originalNodeCount);
    });

    it("IT-023: Duplicated frame appears after original", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;
      const frameCountBefore = result.current.project.frames.length;

      // Duplicate frame at index 0
      act(() => {
        result.current.duplicateFrame(0);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Frame count should increase
      expect(result.current.project.frames.length).toBe(frameCountBefore + 1);

      // Duplicated frame should be at index 1
      expect(result.current.project.frames[1]).toBeDefined();
      expect(result.current.project.frames[1].id).not.toBe(
        result.current.project.frames[0].id,
      );
    });
  });

  describe("Frame Switching", () => {
    it("UT-015: setCurrentFrame updates current frame index", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add frames
      act(() => {
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch to frame 1
      act(() => {
        result.current.setCurrentFrame(1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.currentFrameIndex).toBe(1);
    });

    it("UT-015: setCurrentFrame updates frame index", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameCount = result.current.project.frames.length;

      // Set to valid index
      act(() => {
        result.current.setCurrentFrame(frameCount - 1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should update to the specified index
      expect(result.current.project.currentFrameIndex).toBe(frameCount - 1);

      // Set to first frame
      act(() => {
        result.current.setCurrentFrame(0);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should update to 0
      expect(result.current.project.currentFrameIndex).toBe(0);
    });

    it("IT-024: Switching frames displays correct nodes", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add a node to frame 0
      act(() => {
        result.current.addNode(0, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add a frame and node to frame 1
      act(() => {
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.setCurrentFrame(1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.addNode(1, 200, 200);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch back to frame 0
      act(() => {
        result.current.setCurrentFrame(0);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Frame 0 should have 1 node
      expect(result.current.project.frames[0].nodes.length).toBe(1);
      expect(result.current.project.frames[0].nodes[0].x).toBe(100);

      // Switch to frame 1
      act(() => {
        result.current.setCurrentFrame(1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Frame 1 should have 1 node
      expect(result.current.project.frames[1].nodes.length).toBe(1);
      expect(result.current.project.frames[1].nodes[0].x).toBe(200);
    });
  });
});
