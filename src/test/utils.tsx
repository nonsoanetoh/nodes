import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ProjectProvider } from "../app/context/ProjectContext";

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <ProjectProvider>{children}</ProjectProvider>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// Helper to create mock project data
export const createMockProject = (overrides?: Partial<any>) => {
  return {
    name: "Test Project",
    canvasSize: [500, 500] as [number, number],
    backgroundColor: "#E5E5E5",
    nodeSize: 40,
    nodeSizeMultiplier: 1.0,
    nodeColor: "#555555",
    freehandSpacing: 20,
    drawMode: "Freehand" as const,
    imageShuffleType: "Duplicate Repeats" as const,
    frames: [],
    imageLibrary: [],
    currentFrameIndex: 0,
    animationSpeed: 12,
    isPlaying: false,
    exportQualityGIF: 10,
    exportQualityVideo: 0.8,
    showImages: true,
    clipMode: false,
    ...overrides,
  };
};

// Helper to create mock node
export const createMockNode = (overrides?: Partial<any>) => {
  return {
    id: `node-${Date.now()}-${Math.random()}`,
    x: 100,
    y: 100,
    size: 1.0,
    ...overrides,
  };
};

// Helper to create mock frame
export const createMockFrame = (overrides?: Partial<any>) => {
  return {
    id: `frame-${Date.now()}-${Math.random()}`,
    nodes: [],
    referenceOpacity: 100,
    ...overrides,
  };
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));
