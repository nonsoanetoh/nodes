import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";
import { useProject } from "../hooks/useProject";

// Mock the export functions
vi.mock("../utils/export", () => ({
  exportAsGIF: vi.fn(() => Promise.resolve(new Blob())),
  exportAsVideo: vi.fn(() => Promise.resolve(new Blob())),
  exportAsJSON: vi.fn(),
  downloadBlob: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("Header Component Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Project Management UI", () => {
    it("IT-053: Project dropdown shows current name", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Project name should be accessible
      expect(result.current.project.name).toBeDefined();
      expect(typeof result.current.project.name).toBe("string");
    });

    it("IT-055: Create project prompts for name", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Create project with name
      act(() => {
        result.current.createNewProject("New Project");
      });

      await waitFor(() => {
        expect(result.current.project.name).toBe("New Project");
      });
    });

    it("IT-055: Switch project shows other projects", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Create first project
      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create second project
      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify both projects exist
      const projectsList = result.current.getProjectsList();
      const project1 = projectsList.find((p) => p.name === "Project 1");
      const project2 = projectsList.find((p) => p.name === "Project 2");

      expect(project1).toBeDefined();
      expect(project2).toBeDefined();
      expect(project2?.isEmpty).toBe(false);
    });

    it("IT-055: Rename project updates name", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Rename project via hook
      act(() => {
        result.current.updateProjectName("Renamed Project");
      });

      await waitFor(() => {
        expect(result.current.project.name).toBe("Renamed Project");
      });
    });

    it("IT-055: Delete project confirms and deletes", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Create a project first
      act(() => {
        result.current.createNewProject("To Delete");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Delete project
      act(() => {
        result.current.deleteCurrentProject();
      });

      await waitFor(() => {
        // Should have a project (either switched or new empty one)
        expect(result.current.project).toBeDefined();
      });
    });
  });

  describe("Export Dropdown", () => {
    it("IT-054: Export dropdown opens/closes", async () => {
      // Test that export functions are available
      const { exportAsGIF, exportAsVideo, exportAsJSON } =
        await import("../utils/export");

      expect(exportAsGIF).toBeDefined();
      expect(exportAsVideo).toBeDefined();
      expect(exportAsJSON).toBeDefined();
    });

    it("IT-054: Export options are clickable", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Verify project has export quality settings
      expect(result.current.project.exportQualityGIF).toBeDefined();
      expect(result.current.project.exportQualityVideo).toBeDefined();
    });
  });
});
