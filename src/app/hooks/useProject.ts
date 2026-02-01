"use client";
import { useState, useRef, useEffect } from "react";
import {
  Project,
  Frame,
  createEmptyProject,
  createNode,
  createFrame,
} from "../types/project";

export function useProject() {
  const [project, setProject] = useState<Project>(() => createEmptyProject());
  const projectRef = useRef<Project>(project);

  // History stacks for undo/redo
  const historyRef = useRef<Project[]>([]);
  const futureRef = useRef<Project[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const maxHistorySize = 50;

  // Keep ref in sync with project state
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Helper to save current state to history
  const saveToHistory = (currentProject: Project) => {
    historyRef.current.push(JSON.parse(JSON.stringify(currentProject)));
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current.shift();
    }
    // Clear future when new action is performed
    futureRef.current = [];
    // Update flags synchronously
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(false);
  };

  // Helper to update project and save to history
  const updateProjectWithHistory = (updater: (prev: Project) => Project) => {
    const currentProject = projectRef.current;
    const newProject = updater(currentProject);
    // Save to history and update flags synchronously BEFORE setProject
    saveToHistory(currentProject);
    // Now update project state
    setProject(newProject);
  };

  const addNode = (
    frameIndex: number,
    x: number,
    y: number,
    saveHistory: boolean = true,
  ) => {
    const addNodeLogic = (prev: Project) => {
      const currentFrame = prev.frames[frameIndex];
      const nodeCount = currentFrame.nodes.length;

      // Use the same calculation function for consistency
      const imageIndex = calculateImageIndex(
        nodeCount,
        nodeCount,
        prev.imageShuffleType,
        prev.imageLibrary.length,
      );

      const newNode = createNode(
        x,
        y,
        undefined,
        prev.nodeSizeMultiplier,
        imageIndex,
      );
      const updatedFrames = [...prev.frames];
      updatedFrames[frameIndex] = {
        ...updatedFrames[frameIndex],
        nodes: [...updatedFrames[frameIndex].nodes, newNode],
      };
      return {
        ...prev,
        frames: updatedFrames,
      };
    };

    if (saveHistory) {
      updateProjectWithHistory(addNodeLogic);
    } else {
      setProject(addNodeLogic);
    }
  };

  // Batch node position updates (for dragging) - only save to history on mouse up
  const updateNodePosition = (
    frameIndex: number,
    nodeId: string,
    x: number,
    y: number,
    saveHistory: boolean = false,
  ) => {
    if (saveHistory) {
      // Save to history when drag ends (entire drag is one undoable action)
      updateProjectWithHistory((prev) => {
        const updatedFrames = [...prev.frames];
        const frame = updatedFrames[frameIndex];
        updatedFrames[frameIndex] = {
          ...frame,
          nodes: frame.nodes.map((node) =>
            node.id === nodeId ? { ...node, x, y } : node,
          ),
        };
        return {
          ...prev,
          frames: updatedFrames,
        };
      });
    } else {
      // Don't save history during drag (only on mouse up)
      setProject((prev) => {
        const updatedFrames = [...prev.frames];
        const frame = updatedFrames[frameIndex];
        updatedFrames[frameIndex] = {
          ...frame,
          nodes: frame.nodes.map((node) =>
            node.id === nodeId ? { ...node, x, y } : node,
          ),
        };
        return {
          ...prev,
          frames: updatedFrames,
        };
      });
    }
  };

  // Remove a node from a frame - saves to history
  const removeNode = (frameIndex: number, nodeId: string) => {
    updateProjectWithHistory((prev) => {
      const updatedFrames = [...prev.frames];
      const frame = updatedFrames[frameIndex];
      updatedFrames[frameIndex] = {
        ...frame,
        nodes: frame.nodes.filter((node) => node.id !== nodeId),
      };
      return {
        ...prev,
        frames: updatedFrames,
      };
    });
  };

  const setNodeSizeMultiplier = (multiplier: number) => {
    // Node size multiplier changes don't save history
    setProject((prev) => ({
      ...prev,
      nodeSizeMultiplier: multiplier,
    }));
  };

  const setCurrentFrame = (frameIndex: number) => {
    // Frame switching doesn't need history
    setProject((prev) => ({
      ...prev,
      currentFrameIndex: frameIndex,
    }));
  };

  const addFrame = () => {
    // Frame additions don't save history (only node changes do)
    setProject((prev) => ({
      ...prev,
      frames: [...prev.frames, createFrame()],
    }));
  };

  const removeFrame = (frameIndex: number) => {
    // Frame removals don't save history (only node changes do)
    setProject((prev) => {
      if (prev.frames.length <= 1) return prev;
      const updatedFrames = prev.frames.filter(
        (_, index) => index !== frameIndex,
      );
      const newCurrentIndex =
        frameIndex >= updatedFrames.length
          ? updatedFrames.length - 1
          : prev.currentFrameIndex;
      return {
        ...prev,
        frames: updatedFrames,
        currentFrameIndex: newCurrentIndex,
      };
    });
  };

  const duplicateFrame = (frameIndex: number) => {
    setProject((prev) => {
      const frameToDuplicate = prev.frames[frameIndex];
      const duplicatedFrame: Frame = {
        ...frameToDuplicate,
        id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        nodes: frameToDuplicate.nodes.map((node) => ({
          ...node,
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        })),
      };
      const updatedFrames = [...prev.frames];
      updatedFrames.splice(frameIndex + 1, 0, duplicatedFrame);
      return {
        ...prev,
        frames: updatedFrames,
      };
    });
  };

  // Helper to calculate image index for a node based on shuffle type
  const calculateImageIndex = (
    nodeIndex: number,
    totalNodesInFrame: number,
    shuffleType: "Duplicate Repeats" | "Random" | "Sequential",
    imageLibraryLength: number,
  ): number | undefined => {
    if (imageLibraryLength === 0) return undefined;

    switch (shuffleType) {
      case "Sequential":
        // Cycle through images sequentially
        return nodeIndex % imageLibraryLength;
      case "Random":
        // Use a deterministic "random" based on node index for consistency
        // This ensures the same node always gets the same image for the same shuffle type
        const seed = nodeIndex * 7919; // Prime number for better distribution
        return seed % imageLibraryLength;
      case "Duplicate Repeats":
        // Use same image until all images used, then repeat
        const imagesPerRepeat = imageLibraryLength;
        return Math.floor(nodeIndex / imagesPerRepeat) % imageLibraryLength;
    }
  };

  // Reassign images to all nodes based on current shuffle type
  const reassignNodeImages = (
    shuffleType: "Duplicate Repeats" | "Random" | "Sequential",
  ) => {
    setProject((prev) => {
      if (prev.imageLibrary.length === 0) return prev;

      const updatedFrames = prev.frames.map((frame) => {
        const updatedNodes = frame.nodes.map((node, nodeIndex) => {
          const imageIndex = calculateImageIndex(
            nodeIndex,
            frame.nodes.length,
            shuffleType,
            prev.imageLibrary.length,
          );
          return {
            ...node,
            imageIndex,
          };
        });
        return {
          ...frame,
          nodes: updatedNodes,
        };
      });

      return {
        ...prev,
        frames: updatedFrames,
      };
    });
  };

  const updateSettings = (updates: Partial<Project>) => {
    // Settings changes don't save history (only node changes do)
    setProject((prev) => {
      const newSettings = {
        ...prev,
        ...updates,
      };

      // If image shuffle type changed, reassign images to all nodes
      if (
        updates.imageShuffleType &&
        updates.imageShuffleType !== prev.imageShuffleType &&
        newSettings.imageLibrary.length > 0
      ) {
        // Reassign images immediately with new shuffle type
        const shuffleType = updates.imageShuffleType as
          | "Duplicate Repeats"
          | "Random"
          | "Sequential";
        const updatedFrames = newSettings.frames.map((frame) => {
          const updatedNodes = frame.nodes.map((node, nodeIndex) => {
            const imageIndex = calculateImageIndex(
              nodeIndex,
              frame.nodes.length,
              shuffleType,
              newSettings.imageLibrary.length,
            );
            return {
              ...node,
              imageIndex,
            };
          });
          return {
            ...frame,
            nodes: updatedNodes,
          };
        });
        return {
          ...newSettings,
          frames: updatedFrames,
        };
      }

      // If image library changed and now has images, assign images to all nodes
      if (
        updates.imageLibrary &&
        updates.imageLibrary.length > 0 &&
        (prev.imageLibrary.length === 0 ||
          updates.imageLibrary.length !== prev.imageLibrary.length)
      ) {
        // Assign images to all nodes using current shuffle type
        const shuffleType = newSettings.imageShuffleType;
        const updatedFrames = newSettings.frames.map((frame) => {
          const updatedNodes = frame.nodes.map((node, nodeIndex) => {
            const imageIndex = calculateImageIndex(
              nodeIndex,
              frame.nodes.length,
              shuffleType,
              newSettings.imageLibrary.length,
            );
            return {
              ...node,
              imageIndex,
            };
          });
          return {
            ...frame,
            nodes: updatedNodes,
          };
        });
        return {
          ...newSettings,
          frames: updatedFrames,
        };
      }

      return newSettings;
    });
  };

  const setIsPlaying = (playing: boolean) => {
    setProject((prev) => ({
      ...prev,
      isPlaying: playing,
    }));
  };

  const updateFrameReferenceImage = (
    frameIndex: number,
    referenceImage: string | null,
  ) => {
    // Reference image changes don't save history (only node changes do)
    setProject((prev) => {
      const updatedFrames = [...prev.frames];
      updatedFrames[frameIndex] = {
        ...updatedFrames[frameIndex],
        referenceImage: referenceImage || undefined,
      };
      return {
        ...prev,
        frames: updatedFrames,
      };
    });
  };

  const updateFrameReferenceOpacity = (frameIndex: number, opacity: number) => {
    // Reference opacity changes don't save history (only node changes do)
    setProject((prev) => {
      const updatedFrames = [...prev.frames];
      updatedFrames[frameIndex] = {
        ...updatedFrames[frameIndex],
        referenceOpacity: opacity,
      };
      return {
        ...prev,
        frames: updatedFrames,
      };
    });
  };

  const undo = () => {
    if (historyRef.current.length === 0) return;

    const previousState = historyRef.current.pop()!;
    // Update canUndo/canRedo synchronously before setProject
    setCanUndo(historyRef.current.length > 0);

    setProject((current) => {
      futureRef.current.push(JSON.parse(JSON.stringify(current)));
      if (futureRef.current.length > maxHistorySize) {
        futureRef.current.shift();
      }
      setCanRedo(futureRef.current.length > 0);
      // Preserve UI state (drawMode, currentFrameIndex, etc.) - only restore node-related state
      return {
        ...previousState,
        drawMode: current.drawMode,
        currentFrameIndex: current.currentFrameIndex,
        nodeSizeMultiplier: current.nodeSizeMultiplier,
        isPlaying: current.isPlaying,
      };
    });
  };

  const redo = () => {
    if (futureRef.current.length === 0) return;

    const currentProject = projectRef.current;
    const nextState = futureRef.current.pop()!;

    // Update flags synchronously BEFORE setProject
    setCanRedo(futureRef.current.length > 0);

    // Save current state to history
    historyRef.current.push(JSON.parse(JSON.stringify(currentProject)));
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current.shift();
    }
    setCanUndo(historyRef.current.length > 0);

    // Preserve UI state (drawMode, currentFrameIndex, etc.) - only restore node-related state
    const restoredState = {
      ...nextState,
      drawMode: currentProject.drawMode,
      currentFrameIndex: currentProject.currentFrameIndex,
      nodeSizeMultiplier: currentProject.nodeSizeMultiplier,
      isPlaying: currentProject.isPlaying,
    };

    setProject(restoredState);
  };

  return {
    project,
    addNode,
    updateNodePosition,
    removeNode,
    setNodeSizeMultiplier,
    setCurrentFrame,
    addFrame,
    removeFrame,
    duplicateFrame,
    updateSettings,
    setIsPlaying,
    updateFrameReferenceImage,
    updateFrameReferenceOpacity,
    reassignNodeImages,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
