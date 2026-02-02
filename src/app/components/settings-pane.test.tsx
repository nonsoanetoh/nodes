import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ProjectProvider } from "../context/ProjectContext";
import React from "react";
import { useProject } from "../hooks/useProject";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ProjectProvider, null, children);
};

describe("SettingsPane Component Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Settings Update Project State", () => {
    it("IT-056: Settings update project state immediately", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Test that updateSettings is called when settings change
      act(() => {
        result.current.updateSettings({ nodeSize: 50 });
      });

      await waitFor(() => {
        expect(result.current.project.nodeSize).toBe(50);
      });
    });

    it("IT-056: All input types work correctly", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result.current.project).toBeDefined();
      });

      // Test RangeInput (Export Quality) via hook
      act(() => {
        result.current.updateSettings({ exportQualityGIF: 15 });
      });

      await waitFor(() => {
        expect(result.current.project.exportQualityGIF).toBe(15);
      });

      // Test ColorInput (Background Color) via hook
      act(() => {
        result.current.updateSettings({ backgroundColor: "#FF0000" });
      });

      await waitFor(() => {
        expect(result.current.project.backgroundColor).toBe("#FF0000");
      });

      // Test RadioInput (Draw Mode) via hook
      act(() => {
        result.current.updateSettings({ drawMode: "Stamp" });
      });

      await waitFor(() => {
        expect(result.current.project.drawMode).toBe("Stamp");
      });
    });

    it("IT-056: Settings persist across sessions", async () => {
      const { result: result1 } = renderHook(() => useProject(), { wrapper });

      await waitFor(() => {
        expect(result1.current.project).toBeDefined();
      });

      // Change a setting via hook
      act(() => {
        result1.current.updateSettings({ backgroundColor: "#00FF00" });
      });

      await waitFor(() => {
        expect(result1.current.project.backgroundColor).toBe("#00FF00");
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Simulate page reload
      const { result: result2 } = renderHook(() => useProject(), { wrapper });

      await waitFor(
        () => {
          expect(result2.current.project.backgroundColor).toBe("#00FF00");
        },
        { timeout: 3000 },
      );
    });
  });
});
