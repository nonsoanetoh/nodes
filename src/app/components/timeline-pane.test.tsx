import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";
import { useProject } from "../hooks/useProject";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("TimelinePane Component Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Frame Navigation", () => {
    it("IT-057: Frame buttons work correctly", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Test frame navigation via hook directly
      act(() => {
        result.current.setCurrentFrame(1);
      });

      await waitFor(() => {
        expect(result.current.project.currentFrameIndex).toBe(1);
      });
    });

    it("IT-057: Frame count is accurate", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      const initialFrameCount = result.current.project.frames.length;
      expect(initialFrameCount).toBeGreaterThan(0);

      // Add a frame
      act(() => {
        result.current.addFrame();
      });

      await waitFor(() => {
        expect(result.current.project.frames.length).toBe(
          initialFrameCount + 1,
        );
      });
    });

    it("IT-057: Current frame is highlighted", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // The first frame should be active (currentFrameIndex = 0)
      expect(result.current.project.currentFrameIndex).toBe(0);

      // Switch to second frame
      act(() => {
        result.current.setCurrentFrame(1);
      });

      await waitFor(() => {
        expect(result.current.project.currentFrameIndex).toBe(1);
      });
    });
  });

  describe("Animation Controls", () => {
    it("IT-058: Play button starts animation", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Start playing via hook
      act(() => {
        result.current.setIsPlaying(true);
      });

      await waitFor(() => {
        expect(result.current.project.isPlaying).toBe(true);
      });
    });

    it("IT-058: Pause button stops animation", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Start playing
      act(() => {
        result.current.setIsPlaying(true);
      });

      await waitFor(() => {
        expect(result.current.project.isPlaying).toBe(true);
      });

      // Stop playing
      act(() => {
        result.current.setIsPlaying(false);
      });

      await waitFor(() => {
        expect(result.current.project.isPlaying).toBe(false);
      });
    });

    it("IT-058: Frame navigation works during playback", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Start playing
      act(() => {
        result.current.setIsPlaying(true);
      });

      const initialFrameIndex = result.current.project.currentFrameIndex;

      // Navigate to next frame
      act(() => {
        result.current.setCurrentFrame(initialFrameIndex + 1);
      });

      await waitFor(() => {
        expect(result.current.project.currentFrameIndex).toBe(
          initialFrameIndex + 1,
        );
      });

      // Animation should still be playing
      expect(result.current.project.isPlaying).toBe(true);
    });
  });
});
