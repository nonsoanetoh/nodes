"use client";
import { useState, useEffect, useRef } from "react";
import styles from "../styles/timeline.module.css";
import RangeInput from "./settings/range-input";
import ButtonControl from "./settings/button";
import Play from "./icons/play";
import Pause from "./icons/pause";
import Previous from "./icons/prev";
import Next from "./icons/next";
import Add from "./icons/add";
import Remove from "./icons/remove";
import Duplicate from "./icons/duplicate";
import ImageInput from "./settings/image-input";
import ImageListInput from "./settings/image-list-input";
import Redo from "./icons/redo";
import Undo from "./icons/undo";
import Download from "./icons/download";
import { useProjectContext } from "../context/ProjectContext";
import { exportAsGIF, exportAsVideo, downloadBlob } from "../utils/export";
import FrameStrip from "./frame-strip";

const TimelinePane = () => {
  const {
    project,
    setCurrentFrame,
    addFrame,
    removeFrame,
    duplicateFrame,
    clearFrameNodes,
    updateSettings,
    setIsPlaying,
    updateFrameReferenceImage,
    updateFrameReferenceOpacity,
    reassignNodeImages,
    undo,
    redo,
    canUndo,
    canRedo,
    frameThumbnails,
    reorderFrames,
  } = useProjectContext();
  const isPlaying = project.isPlaying;
  const [triggeredShortcut, setTriggeredShortcut] = useState<string | null>(
    null,
  );
  const pressedKeys = useRef<Set<string>>(new Set());
  const indicatorTimeout = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentFrameIndexRef = useRef<number>(project.currentFrameIndex);

  // Convert between 0-based index (internal) and 1-based frame number (display)
  const currentFrameNumber = project.currentFrameIndex + 1;
  const totalFrames = project.frames.length;

  // Keep ref in sync with current frame index
  useEffect(() => {
    currentFrameIndexRef.current = project.currentFrameIndex;
  }, [project.currentFrameIndex]);

  const showIndicator = (key: string) => {
    if (indicatorTimeout.current) {
      clearTimeout(indicatorTimeout.current);
    }

    setTriggeredShortcut(key);
    indicatorTimeout.current = setTimeout(() => {
      setTriggeredShortcut(null);
      indicatorTimeout.current = null;
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only block shortcuts for text inputs, not range inputs
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.type === "text") {
        return;
      }
      if (target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;

      if (pressedKeys.current.has(key)) {
        if (key === "," || key === "<") {
          e.preventDefault();
          e.stopPropagation();
          setCurrentFrame(Math.max(0, project.currentFrameIndex - 1));
        } else if (key === "." || key === ">") {
          e.preventDefault();
          e.stopPropagation();
          setCurrentFrame(
            Math.min(project.frames.length - 1, project.currentFrameIndex + 1),
          );
        }
        return;
      }

      pressedKeys.current.add(key);

      if (key === "," || key === "<") {
        e.preventDefault();
        e.stopPropagation();
        setCurrentFrame(Math.max(0, project.currentFrameIndex - 1));
        showIndicator(",");
      } else if (key === "." || key === ">") {
        e.preventDefault();
        e.stopPropagation();
        setCurrentFrame(
          Math.min(project.frames.length - 1, project.currentFrameIndex + 1),
        );
        showIndicator(".");
      } else if (key === " ") {
        e.preventDefault();
        e.stopPropagation();
        setIsPlaying(!project.isPlaying);
        showIndicator("Space");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      pressedKeys.current.delete(key);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      if (indicatorTimeout.current) {
        clearTimeout(indicatorTimeout.current);
      }
    };
  }, [
    project.currentFrameIndex,
    project.frames.length,
    project.isPlaying,
    setCurrentFrame,
    setIsPlaying,
  ]);

  const handleFrameChange = (frameNumber: number) => {
    // Convert from 1-based frame number to 0-based index
    setCurrentFrame(frameNumber - 1);
  };

  const handlePreviousFrame = (_label: string) => {
    setCurrentFrame(Math.max(0, project.currentFrameIndex - 1));
  };

  const handleNextFrame = (_label: string) => {
    setCurrentFrame(
      Math.min(project.frames.length - 1, project.currentFrameIndex + 1),
    );
  };

  const handleAddFrame = (_label: string) => {
    addFrame();
    // Switch to the newly added frame (it's added at the end)
    setCurrentFrame(project.frames.length);
  };

  const handleRemoveFrame = (_label: string) => {
    if (project.frames.length > 1) {
      removeFrame(project.currentFrameIndex);
    }
  };

  const handleDuplicateFrame = (_label: string) => {
    const currentIndex = project.currentFrameIndex;
    duplicateFrame(currentIndex);
    // Switch to the duplicated frame (inserted right after current)
    setCurrentFrame(currentIndex + 1);
  };

  const handleAnimationSpeedChange = (speed: number) => {
    updateSettings({ animationSpeed: speed });
  };

  const handleReferenceImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFrameReferenceImage(
          project.currentFrameIndex,
          reader.result as string,
        );
      };
      reader.readAsDataURL(file);
    } else {
      updateFrameReferenceImage(project.currentFrameIndex, null);
    }
  };

  const handleReferenceOpacityChange = (opacity: number) => {
    updateFrameReferenceOpacity(project.currentFrameIndex, opacity);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportGIF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const blob = await exportAsGIF(project, (progress) => {
        setExportProgress(progress);
      });
      downloadBlob(blob, `animation-${Date.now()}.gif`);
    } catch (error) {
      console.error("Error exporting GIF:", error);
      alert("Failed to export GIF. Please try again.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const blob = await exportAsVideo(project, (progress) => {
        setExportProgress(progress);
      });
      downloadBlob(blob, `animation-${Date.now()}.webm`);
    } catch (error) {
      console.error("Error exporting video:", error);
      alert("Failed to export video. Please try again.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Get current frame reference image and opacity
  const currentFrame = project.frames[project.currentFrameIndex];
  const referenceImage = currentFrame?.referenceImage || null;
  const referenceOpacity = currentFrame?.referenceOpacity ?? 100;

  // Animation playback effect
  useEffect(() => {
    if (project.isPlaying) {
      // Calculate interval in milliseconds (animationSpeed is frames per second)
      // Convert to milliseconds per frame: 1000ms / framesPerSecond
      const intervalMs = 1000 / project.animationSpeed;

      animationIntervalRef.current = setInterval(() => {
        // Loop back to frame 0 when reaching the end
        const currentIndex = currentFrameIndexRef.current;
        const nextIndex = currentIndex + 1;
        const targetIndex = nextIndex >= project.frames.length ? 0 : nextIndex;
        setCurrentFrame(targetIndex);
      }, intervalMs);
    } else {
      // Clear interval when paused
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [
    project.isPlaying,
    project.animationSpeed,
    project.frames.length,
    setCurrentFrame,
  ]);

  const handleClearNodes = (_label: string) => {
    clearFrameNodes(project.currentFrameIndex);
  };

  return (
    <section className={styles.timeline}>
      <div className={styles.clearNodesContainer}>
        <ButtonControl
          label="Clear nodes"
          onClick={handleClearNodes}
          icon={<Remove />}
          showLabel={true}
        />
      </div>
      <RangeInput
        label={"Playback"}
        value={currentFrameNumber}
        clamp={[1, totalFrames]}
        step={1}
        shortcut={[",", "."]}
        onChange={handleFrameChange}
        triggeredKey={triggeredShortcut}
      />
      <FrameStrip
        frames={project.frames}
        frameThumbnails={frameThumbnails}
        currentFrameIndex={project.currentFrameIndex}
        onSelectFrame={setCurrentFrame}
        onReorder={reorderFrames}
      />

      <div className="row">
        <div className="control-group">
          <ButtonControl
            label={"Previous Frame"}
            onClick={handlePreviousFrame}
            icon={<Previous />}
          />
          <ButtonControl
            label={isPlaying ? "Pause" : "Play"}
            onClick={(_label: string) => setIsPlaying(!project.isPlaying)}
            icon={isPlaying ? <Pause /> : <Play />}
          />
          <ButtonControl
            label={"Next Frame"}
            onClick={handleNextFrame}
            icon={<Next />}
          />
        </div>
        <div className="control-group">
          <ButtonControl
            label={"Undo Action"}
            onClick={(_label: string) => undo()}
            icon={<Undo />}
          />
          <ButtonControl
            label={"Redo Action"}
            onClick={(_label: string) => redo()}
            icon={<Redo />}
          />
        </div>
        <div className="control-group">
          <ButtonControl
            label={"Add Frame"}
            onClick={handleAddFrame}
            icon={<Add />}
            alignment="super"
          />
          <ButtonControl
            label={"Remove Frame"}
            onClick={handleRemoveFrame}
            icon={<Remove />}
            alignment="super"
          />
          <ButtonControl
            label={"Duplicate Frame"}
            onClick={handleDuplicateFrame}
            icon={<Duplicate />}
            alignment="super"
          />
        </div>
      </div>

      <div className="reference-image t-s--large">
        <RangeInput
          label={"Animation Speed"}
          value={project.animationSpeed}
          clamp={[1, 30]}
          step={1}
          onChange={handleAnimationSpeedChange}
        />
      </div>

      {!project.clipMode && (
        <div className="reference-image t-s--large">
          <ImageInput
            label={`Reference Image (Frame ${currentFrameNumber})`}
            value={referenceImage}
            onChange={handleReferenceImageChange}
          />
          <RangeInput
            label={`Reference Opacity (Frame ${currentFrameNumber})`}
            value={referenceOpacity}
            clamp={[10, 100]}
            step={10}
            onChange={handleReferenceOpacityChange}
          />
        </div>
      )}
      <ImageListInput
        label="Image Library (Max 20)"
        value={project.imageLibrary}
        onChange={(images) => updateSettings({ imageLibrary: images })}
        showImages={project.showImages}
        onShowImagesChange={(show) => updateSettings({ showImages: show })}
      />
    </section>
  );
};

export default TimelinePane;
