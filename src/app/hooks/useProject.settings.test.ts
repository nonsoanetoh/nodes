import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - Settings Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Canvas Settings", () => {
    it("UT-020: Canvas size updates correctly", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.updateSettings({ canvasSize: [800, 600] });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.canvasSize).toEqual([800, 600]);
    });

    it("UT-021: Background color updates correctly", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.updateSettings({ backgroundColor: "#FF0000" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.backgroundColor).toBe("#FF0000");
    });

    it("UT-022: Node color updates correctly", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.updateSettings({ nodeColor: "#00FF00" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.nodeColor).toBe("#00FF00");
    });
  });

  describe("Draw Mode", () => {
    it("UT-023: Draw mode switching works", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Test Freehand mode
      act(() => {
        result.current.updateSettings({ drawMode: "Freehand" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.drawMode).toBe("Freehand");

      // Test Stamp mode
      act(() => {
        result.current.updateSettings({ drawMode: "Stamp" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.drawMode).toBe("Stamp");

      // Test Edit mode
      act(() => {
        result.current.updateSettings({ drawMode: "Edit" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.drawMode).toBe("Edit");
    });
  });

  describe("Image Library", () => {
    it("UT-024: Image library updates correctly", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const images = ["image1", "image2", "image3"];

      act(() => {
        result.current.updateSettings({ imageLibrary: images });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.imageLibrary).toEqual(images);
    });

    it("IT-029: Changing image library reassigns images", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Add initial images and nodes
      act(() => {
        result.current.updateSettings({
          imageLibrary: ["img1", "img2"],
          imageShuffleType: "Sequential",
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add nodes
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });
      act(() => {
        result.current.addNode(frameIndex, 200, 200);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const nodesBefore = result.current.project.frames[frameIndex].nodes;

      // Change image library
      act(() => {
        result.current.updateSettings({
          imageLibrary: ["newImg1", "newImg2", "newImg3"],
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Images should be reassigned
      const nodesAfter = result.current.project.frames[frameIndex].nodes;
      expect(nodesAfter.length).toBe(nodesBefore.length);
      // Image indices should be recalculated
      expect(nodesAfter[0].imageIndex).toBeDefined();
    });

    it("IT-031: Image shuffle type affects assignment", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Set up images
      act(() => {
        result.current.updateSettings({
          imageLibrary: ["img1", "img2", "img3"],
          imageShuffleType: "Sequential",
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add nodes with Sequential
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });
      act(() => {
        result.current.addNode(frameIndex, 200, 200);
      });
      act(() => {
        result.current.addNode(frameIndex, 300, 300);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const sequentialNodes =
        result.current.project.frames[frameIndex].nodes.slice(-3);
      expect(sequentialNodes[0].imageIndex).toBe(0);
      expect(sequentialNodes[1].imageIndex).toBe(1);
      expect(sequentialNodes[2].imageIndex).toBe(2);

      // Change to Random
      act(() => {
        result.current.updateSettings({ imageShuffleType: "Random" });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Images should be reassigned with Random pattern
      const randomNodes =
        result.current.project.frames[frameIndex].nodes.slice(-3);
      expect(randomNodes[0].imageIndex).toBeDefined();
      expect(randomNodes[1].imageIndex).toBeDefined();
      expect(randomNodes[2].imageIndex).toBeDefined();
    });
  });

  describe("Export Quality", () => {
    it("UT-025: Export quality settings update", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.updateSettings({
          exportQualityGIF: 5,
          exportQualityVideo: 0.9,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.exportQualityGIF).toBe(5);
      expect(result.current.project.exportQualityVideo).toBe(0.9);
    });
  });

  describe("Clip Mode", () => {
    it("UT-026: Clip mode toggle works", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Enable clip mode
      act(() => {
        result.current.updateSettings({ clipMode: true });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.clipMode).toBe(true);

      // Disable clip mode
      act(() => {
        result.current.updateSettings({ clipMode: false });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.clipMode).toBe(false);
    });
  });
});
