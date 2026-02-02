import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - Animation Playback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Playback Control", () => {
    it("UT-029: setIsPlaying toggles playback", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Initially not playing
      expect(result.current.project.isPlaying).toBe(false);

      // Start playback
      act(() => {
        result.current.setIsPlaying(true);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.isPlaying).toBe(true);

      // Stop playback
      act(() => {
        result.current.setIsPlaying(false);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.isPlaying).toBe(false);
    });
  });
});
