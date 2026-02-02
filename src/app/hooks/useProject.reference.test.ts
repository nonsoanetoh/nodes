import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - Reference Image Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Reference Image", () => {
    it("UT-027: updateFrameReferenceImage updates image", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = 0;
      const imageUrl = "data:image/png;base64,test";

      act(() => {
        result.current.updateFrameReferenceImage(frameIndex, imageUrl);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames[frameIndex].referenceImage).toBe(
        imageUrl,
      );
    });

    it("UT-027: updateFrameReferenceImage can clear image", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = 0;

      // Set image first
      act(() => {
        result.current.updateFrameReferenceImage(
          frameIndex,
          "data:image/png;base64,test",
        );
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        result.current.project.frames[frameIndex].referenceImage,
      ).toBeDefined();

      // Clear image
      act(() => {
        result.current.updateFrameReferenceImage(frameIndex, null);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        result.current.project.frames[frameIndex].referenceImage,
      ).toBeUndefined();
    });

    it("UT-027: updateFrameReferenceImage only affects specific frame", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Add a frame
      act(() => {
        result.current.addFrame();
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set reference image for frame 0
      act(() => {
        result.current.updateFrameReferenceImage(
          0,
          "data:image/png;base64,frame0",
        );
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set reference image for frame 1
      act(() => {
        result.current.updateFrameReferenceImage(
          1,
          "data:image/png;base64,frame1",
        );
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Each frame should have its own image
      expect(result.current.project.frames[0].referenceImage).toBe(
        "data:image/png;base64,frame0",
      );
      expect(result.current.project.frames[1].referenceImage).toBe(
        "data:image/png;base64,frame1",
      );
    });

    it("UT-028: updateFrameReferenceOpacity updates opacity", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = 0;

      act(() => {
        result.current.updateFrameReferenceOpacity(frameIndex, 50);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.frames[frameIndex].referenceOpacity).toBe(
        50,
      );
    });

    it("UT-028: updateFrameReferenceOpacity accepts any value", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = 0;

      // Test setting opacity to 150 (implementation doesn't clamp)
      act(() => {
        result.current.updateFrameReferenceOpacity(frameIndex, 150);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Implementation accepts the value as-is (no clamping)
      expect(result.current.project.frames[frameIndex].referenceOpacity).toBe(
        150,
      );
    });
  });
});
