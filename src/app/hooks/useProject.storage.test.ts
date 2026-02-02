import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";
import { createEmptyProject, createNode } from "../types/project";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook - LocalStorage Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Storage Operations", () => {
    it("UT-033: saveProjectToSlot saves to localStorage", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Modify project
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
        result.current.updateProjectName("Saved Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify it was saved to localStorage
      const stored = localStorage.getItem("nodes-project-slots");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toBeDefined();
      expect(parsed.slot1 || parsed.slot2 || parsed.slot3).toBeDefined();
    });

    it("UT-034: loadProjectFromSlot returns null for empty slots", async () => {
      // Ensure localStorage is empty
      localStorage.clear();

      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check that empty slots return empty projects
      const projectsList = result.current.getProjectsList();
      const emptyProjects = projectsList.filter((p) => p.isEmpty);
      expect(emptyProjects.length).toBeGreaterThan(0);
    });

    it("UT-034: loadProjectFromSlot returns project for filled slots", async () => {
      const { result: result1 } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result1.current.project.currentFrameIndex;

      act(() => {
        result1.current.addNode(frameIndex, 100, 100);
        result1.current.updateProjectName("Filled Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create new hook instance to test loading
      const { result: result2 } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should load the project
      const projectsList = result2.current.getProjectsList();
      const filledProject = projectsList.find((p) => p.name === "Filled Project");
      expect(filledProject).toBeDefined();
      expect(filledProject?.isEmpty).toBe(false);
    });

    it("UT-034: loadProjectFromSlot validates project structure", async () => {
      // Set invalid project structure (missing frames array)
      localStorage.setItem(
        "nodes-project-slots",
        JSON.stringify({
          slot1: { name: "Invalid", backgroundColor: "#000000" },
          slot2: null,
          slot3: null,
        }),
      );

      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should handle invalid structure gracefully
      expect(result.current.project).toBeDefined();
      expect(result.current.project.frames).toBeDefined();
      expect(Array.isArray(result.current.project.frames)).toBe(true);
    });

    it("IT-045: Storage quota exceeded is handled", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const frameIndex = result.current.project.currentFrameIndex;

      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      localStorage.setItem = vi.fn(() => {
        const error = new DOMException("QuotaExceededError", "QuotaExceededError");
        throw error;
      }) as any;

      // Try to save (should not crash)
      act(() => {
        result.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // App should continue to function
      expect(result.current.project).toBeDefined();
      expect(result.current.addNode).toBeDefined();

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
    it("IT-043: Projects persist across page reloads", async () => {
      const { result: result1 } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result1.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const frameIndex = result1.current.project.currentFrameIndex;

      // Add a node
      act(() => {
        result1.current.addNode(frameIndex, 100, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create second project
      act(() => {
        result1.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Simulate page reload by creating new hook instance
      const { result: result2 } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should load projects from localStorage
      const projectsList = result2.current.getProjectsList();
      expect(projectsList.length).toBe(3);

      // Find Project 1 and Project 2
      const project1 = projectsList.find((p) => p.name === "Project 1");
      const project2 = projectsList.find((p) => p.name === "Project 2");

      expect(project1).toBeDefined();
      expect(project1?.isEmpty).toBe(false);
      expect(project2).toBeDefined();
      expect(project2?.isEmpty).toBe(false);
    });

    it("IT-044: Corrupted localStorage is handled", async () => {
      // Set corrupted data
      localStorage.setItem("nodes-project-slots", "invalid json{");

      const { result } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should handle gracefully and create empty project
      expect(result.current.project).toBeDefined();
      expect(result.current.project.frames).toBeDefined();
      expect(Array.isArray(result.current.project.frames)).toBe(true);
    });

    it("IT-043: Current slot persists", async () => {
      const { result: result1 } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result1.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      act(() => {
        result1.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const slot = result1.current.currentSlot;

      // Simulate page reload
      const { result: result2 } = renderHook(() => useProject(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should restore to same slot
      expect(result2.current.currentSlot).toBe(slot);
    });
  });
});
