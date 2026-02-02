"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useProjectContext } from "../context/ProjectContext";
import { Node } from "../types/project";
import styles from "../styles/canvas.module.css";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { project, addNode, updateNodePosition, removeNode } =
    useProjectContext();
  const isPlaying = project.isPlaying;

  // State for freehand drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const lastNodePositionRef = useRef<{ x: number; y: number } | null>(null);
  const freehandStartNodeCountRef = useRef<number>(0);

  // State for Edit mode
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // State for preview node
  const [mousePosition, setMousePosition] = useState<[number, number] | null>(
    null,
  );

  // State to trigger re-render when reference images load
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Cache for loaded reference images
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Helper function to calculate canvas display dimensions
  // Height is constrained to not exceed container width
  const getCanvasDisplayDimensions = useCallback(
    (containerWidth: number): [number, number] => {
      const [canvasWidth, canvasHeight] = project.canvasSize;
      const aspectRatio = canvasHeight / canvasWidth;

      // Calculate based on width first
      let canvasDisplayWidth = containerWidth;
      let canvasDisplayHeight = containerWidth * aspectRatio;

      // If height exceeds container width, recalculate based on height constraint
      if (canvasDisplayHeight > containerWidth) {
        canvasDisplayHeight = containerWidth;
        canvasDisplayWidth = containerWidth / aspectRatio;
      }

      return [canvasDisplayWidth, canvasDisplayHeight];
    },
    [project.canvasSize],
  );

  // Helper function to convert screen coordinates to normalized
  const screenToNormalized = (
    screenX: number,
    screenY: number,
  ): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];

    const container = canvas.parentElement;
    if (!container) return [0, 0];

    const rect = canvas.getBoundingClientRect();
    const containerWidth = container.clientWidth;
    const [canvasDisplayWidth, canvasDisplayHeight] =
      getCanvasDisplayDimensions(containerWidth);

    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;

    const normalizedX = relativeX / canvasDisplayWidth;
    const normalizedY = relativeY / canvasDisplayHeight;

    return [
      Math.max(0, Math.min(1, normalizedX)),
      Math.max(0, Math.min(1, normalizedY)),
    ];
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Helper function to find node at a position
  const findNodeAtPosition = (
    normalizedX: number,
    normalizedY: number,
  ): { nodeId: string; node: Node } | null => {
    const currentFrame = project.frames[project.currentFrameIndex];
    if (!currentFrame) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const container = canvas.parentElement;
    if (!container) return null;

    const containerWidth = container.clientWidth;
    const [canvasDisplayWidth, canvasDisplayHeight] =
      getCanvasDisplayDimensions(containerWidth);

    const pixelX = normalizedX * canvasDisplayWidth;
    const pixelY = normalizedY * canvasDisplayHeight;

    // Check nodes in reverse order (top-most first)
    for (let i = currentFrame.nodes.length - 1; i >= 0; i--) {
      const node = currentFrame.nodes[i];
      const nodeSize = project.nodeSize * node.size;
      const nodePixelX = node.x * canvasDisplayWidth;
      const nodePixelY = node.y * canvasDisplayHeight;
      const nodeX = nodePixelX - nodeSize / 2;
      const nodeY = nodePixelY - nodeSize / 2;

      // Check if click is within node bounds
      if (
        pixelX >= nodeX &&
        pixelX <= nodeX + nodeSize &&
        pixelY >= nodeY &&
        pixelY <= nodeY + nodeSize
      ) {
        return { nodeId: node.id, node };
      }
    }

    return null;
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;

    // Clear any stale dragging state if not in Edit mode
    if (project.drawMode !== "Edit" && draggedNodeId) {
      setDraggedNodeId(null);
      dragOffsetRef.current = null;
    }

    const [normalizedX, normalizedY] = screenToNormalized(e.clientX, e.clientY);

    if (project.drawMode === "Edit") {
      // Find node at click position
      const found = findNodeAtPosition(normalizedX, normalizedY);
      if (found) {
        // Calculate offset from node center to click position
        const offsetX = normalizedX - found.node.x;
        const offsetY = normalizedY - found.node.y;
        dragOffsetRef.current = { x: offsetX, y: offsetY };
        setDraggedNodeId(found.nodeId);
      }
    } else if (project.drawMode === "Freehand") {
      setIsDrawing(true);
      lastNodePositionRef.current = { x: normalizedX, y: normalizedY };
      // Save current node count to track this freehand stroke
      const currentFrame = project.frames[project.currentFrameIndex];
      freehandStartNodeCountRef.current = currentFrame?.nodes.length || 0;
      // Place first node immediately - save history only for the first node
      addNode(project.currentFrameIndex, normalizedX, normalizedY, true);
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Always update preview position
    const [normalizedX, normalizedY] = screenToNormalized(e.clientX, e.clientY);
    setMousePosition([normalizedX, normalizedY]);

    // Update hovered node in Edit mode
    if (project.drawMode === "Edit" && !draggedNodeId) {
      const found = findNodeAtPosition(normalizedX, normalizedY);
      setHoveredNodeId(found ? found.nodeId : null);
    } else if (project.drawMode !== "Edit") {
      setHoveredNodeId(null);
    }

    // Handle Edit mode dragging
    if (project.drawMode === "Edit" && draggedNodeId && dragOffsetRef.current) {
      // Apply the offset so the node maintains its relative position to the cursor
      const newX = normalizedX - dragOffsetRef.current.x;
      const newY = normalizedY - dragOffsetRef.current.y;
      updateNodePosition(project.currentFrameIndex, draggedNodeId, newX, newY);
      return;
    }

    // Handle freehand drawing logic
    if (isPlaying || !isDrawing || project.drawMode !== "Freehand") return;

    const lastPos = lastNodePositionRef.current;
    if (!lastPos) return;

    // Calculate distance in normalized coordinates
    // We need to convert to pixel distance for spacing check
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const [canvasDisplayWidth, canvasDisplayHeight] =
      getCanvasDisplayDimensions(containerWidth);

    // Convert normalized distance to pixel distance
    const pixelDistance = calculateDistance(
      lastPos.x * canvasDisplayWidth,
      lastPos.y * canvasDisplayHeight,
      normalizedX * canvasDisplayWidth,
      normalizedY * canvasDisplayHeight,
    );

    // Check if distance exceeds spacing threshold
    if (pixelDistance >= project.freehandSpacing) {
      // Don't save history for subsequent nodes in freehand stroke
      addNode(project.currentFrameIndex, normalizedX, normalizedY, false);
      lastNodePositionRef.current = { x: normalizedX, y: normalizedY };
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (project.drawMode === "Freehand") {
      setIsDrawing(false);
      lastNodePositionRef.current = null;
      // Freehand stroke is complete - history was saved on mouse down
      freehandStartNodeCountRef.current = 0;
    } else if (project.drawMode === "Edit" && draggedNodeId) {
      // Save final position to history when drag ends (entire drag is one undoable action)
      const currentFrame = project.frames[project.currentFrameIndex];
      const draggedNode = currentFrame?.nodes.find(
        (n) => n.id === draggedNodeId,
      );
      if (draggedNode) {
        updateNodePosition(
          project.currentFrameIndex,
          draggedNodeId,
          draggedNode.x,
          draggedNode.y,
          true, // Save to history
        );
      }
      setDraggedNodeId(null);
      dragOffsetRef.current = null;
    }
  };

  // Handle canvas click (for stamp mode)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Prevent edits when playing
    if (isPlaying || project.drawMode !== "Stamp") return;

    const [normalizedX, normalizedY] = screenToNormalized(e.clientX, e.clientY);

    // Each stamp click is a separate action - save history
    addNode(project.currentFrameIndex, normalizedX, normalizedY, true);
  };

  // Handle right-click (for node deletion in Edit mode)
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default context menu

    // Only delete in Edit mode when not playing and hovering over a node
    if (isPlaying || project.drawMode !== "Edit" || !hoveredNodeId) return;

    removeNode(project.currentFrameIndex, hoveredNodeId);
    setHoveredNodeId(null); // Clear hover state after deletion
  };

  // Handle keyboard events for node deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Delete/Backspace in Edit mode when hovering over a node
      if (
        isPlaying ||
        project.drawMode !== "Edit" ||
        !hoveredNodeId ||
        (e.key !== "Delete" && e.key !== "Backspace")
      ) {
        return;
      }

      // Prevent default browser behavior (e.g., going back in history)
      e.preventDefault();
      removeNode(project.currentFrameIndex, hoveredNodeId);
      setHoveredNodeId(null); // Clear hover state after deletion
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isPlaying,
    project.drawMode,
    project.currentFrameIndex,
    hoveredNodeId,
    removeNode,
  ]);

  // Handle mouse leave (stop drawing/dragging if mouse leaves canvas)
  const handleMouseLeave = () => {
    setIsDrawing(false);
    lastNodePositionRef.current = null;
    setDraggedNodeId(null);
    dragOffsetRef.current = null;
    setHoveredNodeId(null);
    setMousePosition(null); // Clear preview when mouse leaves
  };

  // Determine cursor style based on current state
  const getCursorStyle = (): string => {
    if (isPlaying) {
      return "not-allowed"; // Can't edit while playing
    }

    switch (project.drawMode) {
      case "Edit":
        if (draggedNodeId) {
          return "grabbing"; // Actively dragging a node
        }
        if (hoveredNodeId) {
          return "grab"; // Hovering over a draggable node
        }
        return "default"; // Edit mode but not over a node
      case "Freehand":
        if (isDrawing) {
          return "crosshair"; // Actively drawing
        }
        return "crosshair"; // Ready to draw
      case "Stamp":
        return "crosshair"; // Ready to stamp
      default:
        return "default";
    }
  };

  // Clear dragging state when switching away from Edit mode
  useEffect(() => {
    if (project.drawMode !== "Edit") {
      // Only clear refs - state will be cleared by mouse handlers on next interaction
      dragOffsetRef.current = null;
    }
  }, [project.drawMode]);

  // Convert Set to string for stable dependency tracking
  const loadedImagesKey = useMemo(
    () => Array.from(loadedImages).sort().join(","),
    [loadedImages],
  );

  // Extract primitive values for stable dependencies
  const canvasWidth = project.canvasSize[0];
  const canvasHeight = project.canvasSize[1];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const [canvasDisplayWidth, canvasDisplayHeight] =
      getCanvasDisplayDimensions(containerWidth);

    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasDisplayWidth * dpr;
    canvas.height = canvasDisplayHeight * dpr;

    ctx.scale(dpr, dpr);

    // Draw background
    ctx.fillStyle = project.backgroundColor;
    ctx.fillRect(0, 0, canvasDisplayWidth, canvasDisplayHeight);

    const currentFrame = project.frames[project.currentFrameIndex];

    // Load and cache clip background image if clip mode is enabled
    if (project.clipMode && project.clipBackgroundImage) {
      const clipImg = imageCacheRef.current.get(project.clipBackgroundImage);
      if (!clipImg) {
        // Load clip background image if not cached
        const img = new Image();
        img.onload = () => {
          imageCacheRef.current.set(project.clipBackgroundImage!, img);
          setLoadedImages((prev) =>
            new Set(prev).add(project.clipBackgroundImage!),
          );
        };
        img.onerror = () => {
          console.error("Failed to load clip background image");
        };
        img.src = project.clipBackgroundImage;
        imageCacheRef.current.set(project.clipBackgroundImage, img);
      } else if (clipImg.complete) {
        // Image is already loaded, ensure it's in loadedImages for re-render tracking
        setLoadedImages((prev) => {
          if (!prev.has(project.clipBackgroundImage!)) {
            return new Set(prev).add(project.clipBackgroundImage!);
          }
          return prev;
        });
      }
    }

    // Draw reference image if it exists (drawn before nodes so nodes appear on top)
    // Hide reference image when clip mode is enabled
    if (currentFrame?.referenceImage && !project.clipMode) {
      const imageUrl = currentFrame.referenceImage;
      const cachedImg = imageCacheRef.current.get(imageUrl);

      if (cachedImg && cachedImg.complete) {
        // Image is already loaded, draw it synchronously
        ctx.save();
        ctx.globalAlpha = (currentFrame.referenceOpacity || 100) / 100;
        ctx.drawImage(cachedImg, 0, 0, canvasDisplayWidth, canvasDisplayHeight);
        ctx.restore();
      } else if (!cachedImg) {
        // Image not in cache, load it
        const img = new Image();
        img.onload = () => {
          imageCacheRef.current.set(imageUrl, img);
          setLoadedImages((prev) => new Set(prev).add(imageUrl));
        };
        img.src = imageUrl;
        imageCacheRef.current.set(imageUrl, img);
      }
    }

    // Function to draw a single node
    const drawNode = (
      node: {
        x: number;
        y: number;
        size: number;
        imageIndex?: number;
      },
      baseNodeSize: number,
      nodeColor: string,
      imageLibrary: string[],
    ) => {
      const pixelX = node.x * canvasDisplayWidth;
      const pixelY = node.y * canvasDisplayHeight;
      const nodeSize = baseNodeSize * node.size;
      const nodeX = pixelX - nodeSize / 2;
      const nodeY = pixelY - nodeSize / 2;

      // Clip mode: nodes reveal the background image
      if (project.clipMode && project.clipBackgroundImage) {
        const clipImg = imageCacheRef.current.get(project.clipBackgroundImage);
        if (clipImg && clipImg.complete && clipImg.naturalWidth > 0) {
          ctx.save();
          // Create square clip path
          ctx.beginPath();
          ctx.rect(nodeX, nodeY, nodeSize, nodeSize);
          ctx.clip();
          // Draw the background image within the clipped area
          // The image is drawn at full canvas size, but only the clipped square area will be visible
          ctx.drawImage(clipImg, 0, 0, canvasDisplayWidth, canvasDisplayHeight);
          ctx.restore();
        } else {
          // Background image is loading or not available, draw placeholder
          ctx.fillStyle = nodeColor;
          ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
        }
      } else {
        // Normal mode: draw image on node or solid color
        // Draw image if available and images are enabled, otherwise draw solid color
        if (
          project.showImages &&
          node.imageIndex !== undefined &&
          imageLibrary[node.imageIndex] !== undefined
        ) {
          const imageUrl = imageLibrary[node.imageIndex];
          const cachedImg = imageCacheRef.current.get(imageUrl);

          if (cachedImg && cachedImg.complete) {
            // Draw image with aspect ratio preserved
            ctx.save();
            const imgAspectRatio = cachedImg.width / cachedImg.height;
            let drawWidth = nodeSize;
            let drawHeight = nodeSize;
            let drawX = nodeX;
            let drawY = nodeY;

            // Calculate dimensions to fit within nodeSize while preserving aspect ratio
            if (imgAspectRatio > 1) {
              // Image is wider than tall
              drawHeight = nodeSize / imgAspectRatio;
              drawY = nodeY + (nodeSize - drawHeight) / 2;
            } else {
              // Image is taller than wide or square
              drawWidth = nodeSize * imgAspectRatio;
              drawX = nodeX + (nodeSize - drawWidth) / 2;
            }

            ctx.drawImage(cachedImg, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
          } else if (!cachedImg) {
            // Load image if not cached
            const img = new Image();
            img.onload = () => {
              imageCacheRef.current.set(imageUrl, img);
              setLoadedImages((prev) => new Set(prev).add(imageUrl));
            };
            img.src = imageUrl;
            imageCacheRef.current.set(imageUrl, img);
            // Draw placeholder color while loading
            ctx.fillStyle = nodeColor;
            ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
          } else {
            // Image is loading, draw placeholder
            ctx.fillStyle = nodeColor;
            ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
          }
        } else {
          // No image, draw solid color
          ctx.fillStyle = nodeColor;
          ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
        }
      }
    };

    // Draw all nodes
    if (currentFrame) {
      currentFrame.nodes.forEach((node) => {
        drawNode(
          node,
          project.nodeSize,
          project.nodeColor,
          project.imageLibrary,
        );
      });
    }

    // Draw preview node at cursor position (only when not playing and not in Edit mode)
    if (
      !isPlaying &&
      mousePosition &&
      project.drawMode !== "Edit" &&
      (!isDrawing || project.drawMode !== "Freehand")
    ) {
      const [previewX, previewY] = mousePosition;
      const previewSize = project.nodeSize * project.nodeSizeMultiplier;
      const previewPixelX = previewX * canvasDisplayWidth;
      const previewPixelY = previewY * canvasDisplayHeight;
      const previewNodeX = previewPixelX - previewSize / 2;
      const previewNodeY = previewPixelY - previewSize / 2;

      // Convert node color to RGBA with reduced opacity
      const hexToRgba = (hex: string, alpha: number): string => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      ctx.fillStyle = hexToRgba(project.nodeColor, 0.35);
      ctx.fillRect(previewNodeX, previewNodeY, previewSize, previewSize);
    }
  }, [
    canvasWidth,
    canvasHeight,
    project.backgroundColor,
    project.frames,
    project.currentFrameIndex,
    project.nodeSize,
    project.nodeSizeMultiplier,
    project.nodeColor,
    project.freehandSpacing,
    project.drawMode,
    project.imageLibrary,
    project.showImages,
    project.clipMode,
    project.clipBackgroundImage,
    mousePosition,
    isDrawing,
    isPlaying,
    draggedNodeId,
    hoveredNodeId,
    getCanvasDisplayDimensions,
    loadedImagesKey,
  ]);

  return (
    <section className={styles.canvas}>
      <canvas
        ref={canvasRef}
        className="canvas__wrapper"
        style={{
          width: "100%",
          height: "auto",
          cursor: getCursorStyle(),
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />
      {isPlaying && (
        <div className={styles.playbackIndicator}>
          <span>Animation Playing</span>
          <span className={styles.playbackHint}>Pause to edit</span>
        </div>
      )}
    </section>
  );
}
