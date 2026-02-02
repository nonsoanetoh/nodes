import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - Undo/Redo System", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("History Management", () => {
    it("UT-016: saveToHistory saves project state", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add a node (this should save to history)
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should be able to undo
      expect(result.current.canUndo).toBe(true);
    });

    it("UT-017: History only tracks node changes", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Settings changes don't save history
      act(() => {
        result.current.updateSettings({ backgroundColor: "#FF0000" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.canUndo).toBe(false);

      // Node additions save history
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.canUndo).toBe(true);
    });

    it("UT-016: History size is limited to maxHistorySize", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;
      const maxHistorySize = 50;

      // Add more than maxHistorySize nodes
      for (let i = 0; i < maxHistorySize + 10; i++) {
        act(() => {
          result.current.addNode(frameIndex, i * 10, i * 10);
        });
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      // Should still be able to undo (history is maintained)
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe("Undo Functionality", () => {
    it("UT-018: undo restores previous state", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;
      const initialNodeCount =
        result.current.project.frames[frameIndex].nodes.length;

      // Add a node
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames[frameIndex].nodes.length).toBe(
        initialNodeCount + 1,
      );

      // Undo
      act(() => {
        result.current.undo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should restore previous state
      expect(result.current.project.frames[frameIndex].nodes.length).toBe(
        initialNodeCount,
      );
    });

    it("IT-026: Undo/redo flags update correctly", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Initially no undo/redo
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      // Add a node
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should be able to undo
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      // Undo
      act(() => {
        result.current.undo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should be able to redo
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it("IT-027: Undo preserves UI state", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set UI state
      act(() => {
        result.current.updateSettings({ drawMode: "Edit" });
      });
      act(() => {
        result.current.setCurrentFrame(2);
      });
      act(() => {
        result.current.setNodeSizeMultiplier(1.5);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const drawMode = result.current.project.drawMode;
      const frameIndex = result.current.project.currentFrameIndex;
      const multiplier = result.current.project.nodeSizeMultiplier;

      // Add a node
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Undo
      act(() => {
        result.current.undo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // UI state should be preserved
      expect(result.current.project.drawMode).toBe(drawMode);
      expect(result.current.project.currentFrameIndex).toBe(frameIndex);
      expect(result.current.project.nodeSizeMultiplier).toBe(multiplier);
    });
  });

  describe("Redo Functionality", () => {
    it("UT-019: redo restores future state", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add a node
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const nodeCountAfterAdd =
        result.current.project.frames[frameIndex].nodes.length;

      // Undo
      act(() => {
        result.current.undo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const nodeCountAfterUndo =
        result.current.project.frames[frameIndex].nodes.length;

      // Redo
      act(() => {
        result.current.redo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should restore the added node
      expect(result.current.project.frames[frameIndex].nodes.length).toBe(
        nodeCountAfterAdd,
      );
      expect(result.current.project.frames[frameIndex].nodes.length).not.toBe(
        nodeCountAfterUndo,
      );
    });

    it("IT-027: Redo preserves UI state", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set UI state
      act(() => {
        result.current.updateSettings({ drawMode: "Stamp" });
      });
      act(() => {
        result.current.setCurrentFrame(1);
      });
      act(() => {
        result.current.setNodeSizeMultiplier(2.0);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const drawMode = result.current.project.drawMode;
      const frameIndex = result.current.project.currentFrameIndex;
      const multiplier = result.current.project.nodeSizeMultiplier;

      const currentFrameIndex = result.current.project.currentFrameIndex;

      // Add a node
      act(() => {
        result.current.addNode(currentFrameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Undo then redo
      act(() => {
        result.current.undo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.redo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // UI state should be preserved
      expect(result.current.project.drawMode).toBe(drawMode);
      expect(result.current.project.currentFrameIndex).toBe(frameIndex);
      expect(result.current.project.nodeSizeMultiplier).toBe(multiplier);
    });
  });

  describe("History Edge Cases", () => {
    it("Undo when no history does nothing", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialProject = JSON.parse(JSON.stringify(result.current.project));

      // Try to undo when no history
      act(() => {
        result.current.undo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Project should remain unchanged
      expect(result.current.project.frames.length).toBe(
        initialProject.frames.length,
      );
    });

    it("Redo when no future does nothing", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialProject = JSON.parse(JSON.stringify(result.current.project));

      // Try to redo when no future
      act(() => {
        result.current.redo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Project should remain unchanged
      expect(result.current.project.frames.length).toBe(
        initialProject.frames.length,
      );
    });

    it("New action clears redo history", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add node 1
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Undo
      act(() => {
        result.current.undo();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.canRedo).toBe(true);

      // Add new node (this should clear redo history)
      act(() => {
        result.current.addNode(frameIndex, 200, 200);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Redo should no longer be available
      expect(result.current.canRedo).toBe(false);
    });
  });
});
