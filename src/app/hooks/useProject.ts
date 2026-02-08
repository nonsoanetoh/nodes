"use client";
import { useState, useRef, useEffect } from "react";
import {
  Project,
  Frame,
  createEmptyProject,
  createNode,
  createFrame,
} from "../types/project";

const STORAGE_KEY = "nodes-project-slots";
const CURRENT_SLOT_KEY = "nodes-current-slot";

type ProjectSlots = {
  slot1: Project | null;
  slot2: Project | null;
  slot3: Project | null;
};

type ProjectInfo = {
  slot: 1 | 2 | 3;
  name: string;
  isEmpty: boolean;
};

// Load all project slots from localStorage
function loadProjectSlotsFromStorage(): ProjectSlots {
  if (typeof window === "undefined") {
    return { slot1: null, slot2: null, slot3: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { slot1: null, slot2: null, slot3: null };

    const parsed = JSON.parse(stored);
    // Validate structure
    if (parsed && typeof parsed === "object") {
      return {
        slot1:
          parsed.slot1 && Array.isArray(parsed.slot1.frames)
            ? parsed.slot1
            : null,
        slot2:
          parsed.slot2 && Array.isArray(parsed.slot2.frames)
            ? parsed.slot2
            : null,
        slot3:
          parsed.slot3 && Array.isArray(parsed.slot3.frames)
            ? parsed.slot3
            : null,
      };
    }
  } catch (error) {
    console.error("Failed to load project slots from localStorage:", error);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { slot1: null, slot2: null, slot3: null };
}

// Get current slot index from localStorage
function getCurrentSlotFromStorage(): 1 | 2 | 3 {
  if (typeof window === "undefined") return 1;

  try {
    const stored = localStorage.getItem(CURRENT_SLOT_KEY);
    if (stored === "2" || stored === "3") {
      return parseInt(stored) as 1 | 2 | 3;
    }
  } catch (error) {
    console.error("Failed to load current slot from localStorage:", error);
  }

  return 1;
}

// Save current slot index to localStorage
function saveCurrentSlotToStorage(slot: 1 | 2 | 3): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CURRENT_SLOT_KEY, slot.toString());
  } catch (error) {
    console.error("Failed to save current slot to localStorage:", error);
  }
}

// Load project from specific slot
function loadProjectFromSlot(slot: 1 | 2 | 3): Project | null {
  const slots = loadProjectSlotsFromStorage();
  const slotKey = `slot${slot}` as keyof ProjectSlots;
  return slots[slotKey];
}

// Save project to specific slot
function saveProjectToSlot(project: Project, slot: 1 | 2 | 3): void {
  if (typeof window === "undefined") return;

  try {
    const slots = loadProjectSlotsFromStorage();
    const slotKey = `slot${slot}` as keyof ProjectSlots;
    slots[slotKey] = project;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch (error) {
    console.error("Failed to save project to localStorage:", error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded");
    }
  }
}

// Get list of all projects with their info
function getProjectsList(): ProjectInfo[] {
  const slots = loadProjectSlotsFromStorage();
  return [
    {
      slot: 1,
      name: slots.slot1?.name || "Empty",
      isEmpty: !slots.slot1,
    },
    {
      slot: 2,
      name: slots.slot2?.name || "Empty",
      isEmpty: !slots.slot2,
    },
    {
      slot: 3,
      name: slots.slot3?.name || "Empty",
      isEmpty: !slots.slot3,
    },
  ];
}

export function useProject() {
  const [currentSlot, setCurrentSlot] = useState<1 | 2 | 3>(() =>
    getCurrentSlotFromStorage(),
  );
  const [project, setProject] = useState<Project>(() => {
    // Try to load from current slot, fallback to empty project
    const slot = getCurrentSlotFromStorage();
    const loaded = loadProjectFromSlot(slot);
    if (loaded) {
      // Ensure name exists (for backward compatibility)
      return {
        ...createEmptyProject(),
        ...loaded,
        name: loaded.name || "Untitled",
      };
    }
    return createEmptyProject();
  });
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

  // Save project to localStorage whenever it changes
  useEffect(() => {
    saveProjectToSlot(project, currentSlot);
  }, [project, currentSlot]);

  // Switch to a different slot
  const switchSlot = (slot: 1 | 2 | 3) => {
    // Save current project before switching
    saveProjectToSlot(projectRef.current, currentSlot);

    // Load project from new slot
    const newProject = loadProjectFromSlot(slot) || createEmptyProject();
    setProject(newProject);
    projectRef.current = newProject;
    setCurrentSlot(slot);
    saveCurrentSlotToStorage(slot);

    // Reset history for new slot
    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  };

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

  const createNewProject = (name?: string) => {
    // Save current project before creating new one
    saveProjectToSlot(projectRef.current, currentSlot);

    // Find an empty slot, or use the first slot if all are full
    const projectsList = getProjectsList();
    const emptySlot = projectsList.find((p) => p.isEmpty);
    const targetSlot = emptySlot ? emptySlot.slot : 1;

    // Create new project with the given name
    const newProject = createEmptyProject(name);

    // Save to target slot
    saveProjectToSlot(newProject, targetSlot);

    // Switch to the target slot (this will load the project we just saved)
    if (targetSlot !== currentSlot) {
      setCurrentSlot(targetSlot);
      saveCurrentSlotToStorage(targetSlot);
    }

    // Set the new project as current
    setProject(newProject);
    projectRef.current = newProject;
    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  };

  const deleteCurrentProject = () => {
    // Clear current slot in storage (do not save current project — we're deleting it)
    const slots = loadProjectSlotsFromStorage();
    const slotKey = `slot${currentSlot}` as keyof ProjectSlots;
    slots[slotKey] = null;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    }

    // Re-read list after clearing; getProjectsList() reads from storage
    const projectsList = getProjectsList();
    const hasOtherProjects = projectsList.some((p) => !p.isEmpty);

    if (hasOtherProjects) {
      // Switch to first available project without saving current (already cleared)
      const firstAvailable = projectsList.find((p) => !p.isEmpty);
      if (firstAvailable) {
        const targetSlot = firstAvailable.slot;
        const newProject =
          loadProjectFromSlot(targetSlot) ||
          createEmptyProject(firstAvailable.name === "Empty" ? "Untitled" : firstAvailable.name);
        const validatedProject = {
          ...createEmptyProject(),
          ...newProject,
          name: newProject.name || "Untitled",
        };
        setProject(validatedProject);
        projectRef.current = validatedProject;
        setCurrentSlot(targetSlot);
        saveCurrentSlotToStorage(targetSlot);
        historyRef.current = [];
        futureRef.current = [];
        setCanUndo(false);
        setCanRedo(false);
      }
    } else {
      // No other projects: create a new empty one in current slot
      const newProject = createEmptyProject("Untitled");
      setProject(newProject);
      projectRef.current = newProject;
      saveProjectToSlot(newProject, currentSlot);
      historyRef.current = [];
      futureRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
    }
  };

  const updateProjectName = (name: string) => {
    setProject((prev) => ({
      ...prev,
      name,
    }));
    // Save will happen automatically via useEffect
  };

  const resetProject = () => {
    createNewProject();
  };

  const importProject = (importedProject: Project) => {
    // Validate imported project structure
    if (
      !importedProject ||
      typeof importedProject !== "object" ||
      !Array.isArray(importedProject.frames)
    ) {
      throw new Error("Invalid project format");
    }

    // Ensure all required fields exist with defaults
    const validatedProject: Project = {
      ...createEmptyProject(),
      ...importedProject,
      // Ensure name exists
      name: importedProject.name || "Untitled",
      // Ensure frames array exists and is valid
      frames: importedProject.frames.map((frame) => ({
        ...createFrame(),
        ...frame,
        nodes: frame.nodes || [],
      })),
    };

    setProject(validatedProject);
    projectRef.current = validatedProject;
    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    // Save to current slot
    saveProjectToSlot(validatedProject, currentSlot);
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
    resetProject: createNewProject, // Keep for backward compatibility
    createNewProject,
    deleteCurrentProject,
    updateProjectName,
    importProject,
    currentSlot,
    switchSlot,
    getProjectsList,
  };
}
