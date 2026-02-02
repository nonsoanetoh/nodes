export interface Node {
  id: string;
  x: number;
  y: number;
  size: number;
  imageIndex?: number;
}

export interface Frame {
  id: string;
  nodes: Node[];
  referenceImage?: string;
  referenceOpacity: number;
}

export interface Project {
  canvasSize: [number, number];
  backgroundColor: string;
  nodeSize: number;
  nodeSizeMultiplier: number;
  nodeColor: string;
  freehandSpacing: number;
  drawMode: "Freehand" | "Stamp" | "Edit";
  imageShuffleType: "Duplicate Repeats" | "Random" | "Sequential";
  frames: Frame[];
  imageLibrary: string[];
  currentFrameIndex: number;
  animationSpeed: number;
  isPlaying: boolean;
  exportQualityGIF: number; // 1-30, lower = better quality
  exportQualityVideo: number; // 0-1, higher = better quality
  showImages: boolean; // Whether to show images on nodes
  clipMode: boolean; // Whether nodes act as clip paths revealing background image
  clipBackgroundImage?: string; // Global background image for clip mode (data URL)
}

export function createEmptyProject(): Project {
  return {
    canvasSize: [500, 500],
    backgroundColor: "#E5E5E5",
    nodeSize: 40,
    nodeSizeMultiplier: 1.0,
    nodeColor: "#555555",
    freehandSpacing: 20,
    drawMode: "Freehand",
    imageShuffleType: "Duplicate Repeats",
    frames: Array.from({ length: 5 }, () => createFrame()),
    imageLibrary: [],
    currentFrameIndex: 0,
    animationSpeed: 12,
    isPlaying: false,
    exportQualityGIF: 10, // Medium quality (lower = better)
    exportQualityVideo: 0.8, // High quality (0-1)
    showImages: true, // Show images by default
    clipMode: false, // Clip mode disabled by default
  };
}

export function createNode(
  x: number,
  y: number,
  id?: string,
  size?: number,
  imageIndex?: number,
): Node {
  return {
    id: id || `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    x,
    y,
    size: size ?? 1.0,
    imageIndex,
  };
}

export function createFrame(id?: string): Frame {
  return {
    id: id || `frame-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    nodes: [],
    referenceOpacity: 100,
  };
}
