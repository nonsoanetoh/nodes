import { describe, it, expect, beforeEach, vi } from "vitest";
import { exportAsJSON } from "./export";
import { createEmptyProject, createNode } from "../types/project";

describe("Export Utilities", () => {
  beforeEach(() => {
    localStorage.clear();

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url") as any;
    global.URL.revokeObjectURL = vi.fn() as any;

    // Mock anchor element
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    // Mock document.createElement to return mock anchor
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "a") return mockAnchor as any;
      // For other elements, use real createElement
      const realCreateElement = HTMLElement.prototype.constructor as any;
      return realCreateElement ? new realCreateElement() : ({} as any);
    }) as any;

    // Mock document.body methods
    document.body.appendChild = vi.fn((el: any) => el) as any;
    document.body.removeChild = vi.fn((el: any) => el) as any;
  });

  describe("JSON Export", () => {
    it("UT-032: exportAsJSON creates JSON and triggers download", () => {
      const project = createEmptyProject("Test Project");

      // Mock createObjectURL before calling
      const createObjectURLSpy = vi.fn(() => "blob:mock-url");
      global.URL.createObjectURL = createObjectURLSpy as any;

      expect(() => {
        exportAsJSON(project);
      }).not.toThrow();

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it("UT-032: exportAsJSON includes all project data", async () => {
      const project = createEmptyProject("Test Project");
      const frame = project.frames[0];
      const node = createNode(100, 200);
      frame.nodes.push(node);

      let capturedBlob: Blob | null = null;
      global.URL.createObjectURL = vi.fn((blob: Blob) => {
        capturedBlob = blob;
        return "blob:mock-url";
      }) as any;

      exportAsJSON(project);

      expect(capturedBlob).not.toBeNull();

      // Read blob using FileReader
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const jsonContent = reader.result as string;
          const parsed = JSON.parse(jsonContent);

          expect(parsed.name).toBe("Test Project");
          expect(parsed.frames).toBeDefined();
          expect(parsed.frames[0].nodes).toBeDefined();
          expect(parsed.frames[0].nodes.length).toBe(1);
          expect(parsed.canvasSize).toEqual([500, 500]);
          expect(parsed.backgroundColor).toBeDefined();
          resolve();
        };
        reader.readAsText(capturedBlob!);
      });
    });

    it("IT-042: JSON export/import roundtrip", async () => {
      const originalProject = createEmptyProject("Original Project");
      const frame = originalProject.frames[0];
      frame.nodes.push(createNode(100, 100));
      frame.nodes.push(createNode(200, 200));
      originalProject.backgroundColor = "#FF0000";
      originalProject.nodeColor = "#00FF00";

      let capturedBlob: Blob | null = null;
      global.URL.createObjectURL = vi.fn((blob: Blob) => {
        capturedBlob = blob;
        return "blob:mock-url";
      }) as any;

      exportAsJSON(originalProject);

      expect(capturedBlob).not.toBeNull();

      // Read blob using FileReader
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const jsonContent = reader.result as string;
          const importedProject = JSON.parse(jsonContent);

          expect(importedProject.name).toBe(originalProject.name);
          expect(importedProject.backgroundColor).toBe(
            originalProject.backgroundColor,
          );
          expect(importedProject.nodeColor).toBe(originalProject.nodeColor);
          expect(importedProject.frames.length).toBe(
            originalProject.frames.length,
          );
          expect(importedProject.frames[0].nodes.length).toBe(
            originalProject.frames[0].nodes.length,
          );
          resolve();
        };
        reader.readAsText(capturedBlob!);
      });
    });
  });
});
