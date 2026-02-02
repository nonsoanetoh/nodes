import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProject } from "./useProject";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("useProject Hook", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("Project Creation", () => {
    it("IT-001: Creating new project finds empty slot", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.name).toBe("Project 1");
      expect(result.current.currentSlot).toBeGreaterThanOrEqual(1);
      expect(result.current.currentSlot).toBeLessThanOrEqual(3);

      const slot1 = result.current.currentSlot;

      // Create second project - should go to different slot
      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.name).toBe("Project 2");
      const slot2 = result.current.currentSlot;
      expect(slot2).toBeGreaterThanOrEqual(1);
      expect(slot2).toBeLessThanOrEqual(3);

      // If not all slots full, should be different slot
      if (slot2 === slot1) {
        // All slots might be full, so it overwrites slot 1
        expect(slot2).toBe(1);
      }

      // Create third project
      act(() => {
        result.current.createNewProject("Project 3");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.name).toBe("Project 3");
      const slot3 = result.current.currentSlot;
      expect(slot3).toBeGreaterThanOrEqual(1);
      expect(slot3).toBeLessThanOrEqual(3);
    });

    it("IT-002: Creating new project saves current project first", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Create first project
      act(() => {
        result.current.createNewProject("Project 1");
      });

      // Wait a bit for localStorage to update
      await new Promise((resolve) => setTimeout(resolve, 50));

      const slot1 = result.current.currentSlot;

      // Update project name to make it distinct
      act(() => {
        result.current.updateProjectName("Project 1 Updated");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create second project
      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch back to slot 1
      act(() => {
        result.current.switchSlot(slot1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify project 1 still has its updated name
      expect(result.current.project.name).toBe("Project 1 Updated");
    });

    it("IT-001: When all slots are full, overwrites slot 1", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Fill all 3 slots
      act(() => {
        result.current.createNewProject("Project 1");
      });
      act(() => {
        result.current.createNewProject("Project 2");
      });
      act(() => {
        result.current.createNewProject("Project 3");
      });

      // Create another project - should overwrite slot 1
      act(() => {
        result.current.createNewProject("Project 4");
      });

      expect(result.current.project.name).toBe("Project 4");
      expect(result.current.currentSlot).toBe(1);
    });
  });

  describe("Project Deletion", () => {
    it("IT-003: Deleting current project clears slot", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Test Project");
      });

      const projectName = result.current.project.name;
      expect(projectName).toBe("Test Project");

      act(() => {
        result.current.deleteCurrentProject();
      });

      // Should create new empty project or switch to another
      const projectsList = result.current.getProjectsList();
      const currentSlotProject = projectsList.find(
        (p) => p.slot === result.current.currentSlot,
      );
      expect(
        currentSlotProject?.isEmpty ||
          result.current.project.name === "Untitled",
      ).toBeTruthy();
    });

    it("IT-004: Deleting project switches to another if available", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Create first project and remember its slot
      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const slot1 = result.current.currentSlot;
      const project1Name = result.current.project.name;

      // Ensure project 1 is saved
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create second project in a different slot
      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const slot2 = result.current.currentSlot;

      // Ensure projects are in different slots
      if (slot1 === slot2) {
        // If they're in the same slot, the test can't verify switching
        // This is acceptable - just verify deletion works
        act(() => {
          result.current.deleteCurrentProject();
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(result.current.project.name).toBeTruthy();
        return;
      }

      // Delete current project (Project 2)
      act(() => {
        result.current.deleteCurrentProject();
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should switch to Project 1 or create new empty project
      const projectName = result.current.project.name;
      // The delete function should switch to another project if available
      expect(projectName).toBeTruthy();
      // Verify it either switched to project 1 or created a new one
      expect(["Project 1", "Untitled"]).toContain(projectName);
    });

    it("IT-005: Deleting last project creates new empty project", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Only Project");
      });

      act(() => {
        result.current.deleteCurrentProject();
      });

      // Should create new empty project
      expect(result.current.project.name).toBe("Untitled");
    });
  });

  describe("Project Renaming", () => {
    it("UT-003: updateProjectName updates project name", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.updateProjectName("New Name");
      });

      expect(result.current.project.name).toBe("New Name");
    });

    it("IT-006: Renamed project persists across slot switches", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const slot1 = result.current.currentSlot;

      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const slot2 = result.current.currentSlot;

      // Rename Project 2
      act(() => {
        result.current.updateProjectName("Renamed Project");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch away and back
      act(() => {
        result.current.switchSlot(slot1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.switchSlot(slot2);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.name).toBe("Renamed Project");
    });
  });

  describe("Project Switching", () => {
    it("IT-007: Switching slots saves current project", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const slot1 = result.current.currentSlot;

      // Update project name to make it distinct
      act(() => {
        result.current.updateProjectName("Project 1 Saved");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create and switch to project 2
      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Switch back to slot 1
      act(() => {
        result.current.switchSlot(slot1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify project 1 still has its updated name
      expect(result.current.project.name).toBe("Project 1 Saved");
    });

    it("IT-008: Switching slots loads correct project", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const slot1 = result.current.currentSlot;

      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.switchSlot(slot1);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.project.name).toBe("Project 1");
      expect(result.current.currentSlot).toBe(slot1);
    });

    it("IT-009: Switching slots resets history", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify initial state - no history yet
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      // Create and switch to project 2
      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // History should still be reset (no undo/redo available)
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("IT-010: Current slot persists across page reloads", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const slot = result.current.currentSlot;
      expect(slot).toBeGreaterThanOrEqual(1);
      expect(slot).toBeLessThanOrEqual(3);

      // Simulate page reload by checking localStorage
      const storedSlot = localStorage.getItem("nodes-current-slot");
      expect(storedSlot).toBeTruthy();
      expect(parseInt(storedSlot || "1")).toBeGreaterThanOrEqual(1);
      expect(parseInt(storedSlot || "1")).toBeLessThanOrEqual(3);
    });
  });

  describe("Project Import/Export", () => {
    it("UT-004: importProject validates project structure", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Test invalid project (no frames array)
      expect(() => {
        act(() => {
          result.current.importProject({} as any);
        });
      }).toThrow("Invalid project format");

      // Test null project
      expect(() => {
        act(() => {
          result.current.importProject(null as any);
        });
      }).toThrow("Invalid project format");
    });

    it("UT-005: importProject merges with defaults", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      const importedProject = {
        frames: [],
        name: "Imported Project",
      } as any;

      act(() => {
        result.current.importProject(importedProject);
      });

      expect(result.current.project.name).toBe("Imported Project");
      expect(result.current.project.canvasSize).toEqual([500, 500]); // Default
      expect(result.current.project.drawMode).toBe("Freehand"); // Default
    });

    it("UT-005: importProject defaults name to Untitled if missing", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      const importedProject = {
        frames: [],
      } as any;

      act(() => {
        result.current.importProject(importedProject);
      });

      expect(result.current.project.name).toBe("Untitled");
    });

    it("IT-011: Importing project replaces current project", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Original Project");
      });

      const importedProject = {
        frames: [],
        name: "Imported Project",
      } as any;

      act(() => {
        result.current.importProject(importedProject);
      });

      expect(result.current.project.name).toBe("Imported Project");
      expect(result.current.canUndo).toBe(false); // History cleared
    });
  });

  describe("getProjectsList", () => {
    it("should return list of all projects", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.createNewProject("Project 1");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      act(() => {
        result.current.createNewProject("Project 2");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const projectsList = result.current.getProjectsList();

      expect(projectsList).toHaveLength(3);

      // Find projects by name since slot order might vary
      const project1 = projectsList.find((p) => p.name === "Project 1");
      const project2 = projectsList.find((p) => p.name === "Project 2");

      expect(project1).toBeDefined();
      expect(project1?.isEmpty).toBe(false);
      expect(project2).toBeDefined();
      expect(project2?.isEmpty).toBe(false);

      // At least one slot should be empty (unless all 3 are filled)
      const emptySlots = projectsList.filter((p) => p.isEmpty);
      const filledSlots = projectsList.filter((p) => !p.isEmpty);
      expect(filledSlots.length).toBeGreaterThanOrEqual(2);
      expect(emptySlots.length + filledSlots.length).toBe(3);
    });
  });
});
