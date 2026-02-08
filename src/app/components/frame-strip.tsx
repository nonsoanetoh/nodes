"use client";
import React, { useState } from "react";
import type { Frame } from "../types/project";
import styles from "../styles/frame-strip.module.css";

type FrameStripProps = {
  frames: Frame[];
  frameThumbnails: Record<string, string>;
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export default function FrameStrip({
  frames,
  frameThumbnails,
  currentFrameIndex,
  onSelectFrame,
  onReorder,
}: FrameStripProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.setData("application/x-frame-index", String(index));
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && dragIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = e.dataTransfer.getData("application/x-frame-index");
    if (fromIndex === "") return;
    const from = parseInt(fromIndex, 10);
    if (Number.isNaN(from) || from === toIndex) return;
    onReorder(from, toIndex);
    setDragIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <div className={styles.strip} role="list" aria-label="Frame strip">
      {frames.map((frame, index) => {
        const thumbnail = frameThumbnails[frame.id];
        const isCurrent = index === currentFrameIndex;
        const isDragging = dragIndex === index;
        const isDropTarget = dropTargetIndex === index;

        return (
          <div
            key={frame.id}
            role="listitem"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onSelectFrame(index)}
            className={`${styles.frame} ${isCurrent ? styles.frameCurrent : ""} ${
              isDragging ? styles.frameDragging : ""
            } ${isDropTarget ? styles.frameDropTarget : ""}`}
            title={`Frame ${index + 1}. Drag to reorder.`}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                className={styles.frameThumb}
              />
            ) : (
              <div className={styles.framePlaceholder}>
                <span className={styles.frameNumber}>{index + 1}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
