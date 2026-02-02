import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - Node Operations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Node Creation", () => {
    it("UT-007: addNode adds node to current frame", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Ensure we have a project with frames
      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;
      const initialNodeCount =
        result.current.project.frames[frameIndex].nodes.length;

      act(() => {
        result.current.addNode(frameIndex, 100, 200);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const currentFrame =
        result.current.project.frames[result.current.project.currentFrameIndex];
      expect(currentFrame.nodes.length).toBe(initialNodeCount + 1);

      const addedNode = currentFrame.nodes[currentFrame.nodes.length - 1];
      expect(addedNode.x).toBe(100);
      expect(addedNode.y).toBe(200);
      expect(addedNode.id).toBeDefined();
    });

    it("IT-013: Adding node in Freehand mode creates multiple nodes", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set to Freehand mode
      act(() => {
        result.current.updateSettings({ drawMode: "Freehand" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;
      const initialNodeCount =
        result.current.project.frames[frameIndex].nodes.length;

      // Simulate dragging (multiple addNode calls)
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });
      act(() => {
        result.current.addNode(frameIndex, 120, 100); // 20px spacing
      });
      act(() => {
        result.current.addNode(frameIndex, 140, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const currentFrame =
        result.current.project.frames[result.current.project.currentFrameIndex];
      expect(currentFrame.nodes.length).toBe(initialNodeCount + 3);
    });

    it("IT-014: Adding node in Stamp mode creates single node", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set to Stamp mode
      act(() => {
        result.current.updateSettings({ drawMode: "Stamp" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;
      const initialNodeCount =
        result.current.project.frames[frameIndex].nodes.length;

      // Add single node
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const currentFrame =
        result.current.project.frames[result.current.project.currentFrameIndex];
      expect(currentFrame.nodes.length).toBe(initialNodeCount + 1);
    });

    it("IT-015: Adding node assigns image index based on shuffle type", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add images to library
      act(() => {
        result.current.updateSettings({
          imageLibrary: ["image1", "image2", "image3"],
          imageShuffleType: "Sequential",
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add nodes
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });
      act(() => {
        result.current.addNode(frameIndex, 200, 100);
      });
      act(() => {
        result.current.addNode(frameIndex, 300, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const currentFrame =
        result.current.project.frames[result.current.project.currentFrameIndex];
      const nodes = currentFrame.nodes.slice(-3); // Get last 3 nodes

      // Sequential should assign 0, 1, 2
      expect(nodes[0].imageIndex).toBe(0);
      expect(nodes[1].imageIndex).toBe(1);
      expect(nodes[2].imageIndex).toBe(2);
    });
  });

  describe("Node Movement", () => {
    it("UT-008: updateNodePosition updates node position", async () => {
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

      const currentFrame = result.current.project.frames[frameIndex];
      const nodeId = currentFrame.nodes[currentFrame.nodes.length - 1].id;

      // Update position
      act(() => {
        result.current.updateNodePosition(frameIndex, nodeId, 200, 300, false);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedNode = result.current.project.frames[frameIndex].nodes.find(
        (n) => n.id === nodeId,
      );
      expect(updatedNode?.x).toBe(200);
      expect(updatedNode?.y).toBe(300);
    });

    it("IT-016: Moving node in Edit mode updates position", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set to Edit mode
      act(() => {
        result.current.updateSettings({ drawMode: "Edit" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Verify frame exists
      expect(result.current.project.frames[frameIndex]).toBeDefined();

      // Add a node
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const currentFrame = result.current.project.frames[frameIndex];
      const nodeId = currentFrame.nodes[currentFrame.nodes.length - 1].id;

      // Simulate drag (no history during drag)
      act(() => {
        result.current.updateNodePosition(frameIndex, nodeId, 150, 150, false);
      });
      act(() => {
        result.current.updateNodePosition(frameIndex, nodeId, 200, 200, false);
      });

      // Save history on mouse up
      act(() => {
        result.current.updateNodePosition(frameIndex, nodeId, 250, 250, true);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedNode = result.current.project.frames[frameIndex].nodes.find(
        (n) => n.id === nodeId,
      );
      expect(updatedNode?.x).toBe(250);
      expect(updatedNode?.y).toBe(250);
      expect(result.current.canUndo).toBe(true); // History saved
    });

    it("IT-017: Moving node doesn't create new nodes", async () => {
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

      const currentFrame = result.current.project.frames[frameIndex];
      const nodeId = currentFrame.nodes[currentFrame.nodes.length - 1].id;
      const nodeCount = currentFrame.nodes.length;

      // Move the node
      act(() => {
        result.current.updateNodePosition(frameIndex, nodeId, 200, 200, false);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Node count should remain the same
      expect(result.current.project.frames[frameIndex].nodes.length).toBe(
        nodeCount,
      );
    });
  });

  describe("Node Deletion", () => {
    it("UT-009: removeNode removes node from frame", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add nodes
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });
      act(() => {
        result.current.addNode(frameIndex, 200, 200);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const currentFrame = result.current.project.frames[frameIndex];
      const nodeId = currentFrame.nodes[0].id;
      const initialCount = currentFrame.nodes.length;

      // Remove node
      act(() => {
        result.current.removeNode(frameIndex, nodeId);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames[frameIndex].nodes.length).toBe(
        initialCount - 1,
      );
      expect(
        result.current.project.frames[frameIndex].nodes.find(
          (n) => n.id === nodeId,
        ),
      ).toBeUndefined();
    });

    it("IT-018: removeNode saves history", async () => {
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

      const currentFrame = result.current.project.frames[frameIndex];
      const nodeId = currentFrame.nodes[0].id;

      // Remove node
      act(() => {
        result.current.removeNode(frameIndex, nodeId);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe("Node Size Multiplier", () => {
    it("UT-010: setNodeSizeMultiplier updates multiplier", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.setNodeSizeMultiplier(1.5);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.nodeSizeMultiplier).toBe(1.5);
    });

    it("IT-020: Node size multiplier affects all nodes", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add nodes
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });
      act(() => {
        result.current.addNode(frameIndex, 200, 200);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Change multiplier
      act(() => {
        result.current.setNodeSizeMultiplier(2.0);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Multiplier should be updated (affects rendering, not node data)
      expect(result.current.project.nodeSizeMultiplier).toBe(2.0);
    });
  });
});
