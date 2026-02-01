"use client";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/settings-pane.module.css";
import DuoInput from "./settings/duo-input";
import ColorInput from "./settings/color-input";
import RadioInput from "./settings/radio-input";
import RangeInput from "./settings/range-input";
import SelectInput from "./settings/select-input";
import { useProjectContext } from "../context/ProjectContext";

const SettingsPane = () => {
  const { project, updateSettings, setNodeSizeMultiplier } =
    useProjectContext();
  const [triggeredShortcut, setTriggeredShortcut] = useState<string | null>(
    null,
  );
  const pressedKeys = useRef<Set<string>>(new Set());
  const indicatorTimeout = useRef<NodeJS.Timeout | null>(null);

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

      const key = e.key.toLowerCase();

      if (pressedKeys.current.has(key)) {
        if (key === "[") {
          e.preventDefault();
          setNodeSizeMultiplier(
            Math.max(0.2, project.nodeSizeMultiplier - 0.1),
          );
        } else if (key === "]") {
          e.preventDefault();
          setNodeSizeMultiplier(
            Math.min(3.0, project.nodeSizeMultiplier + 0.1),
          );
        }
        return;
      }

      pressedKeys.current.add(key);

      if (e.key === "[") {
        e.preventDefault();
        setNodeSizeMultiplier(Math.max(0.2, project.nodeSizeMultiplier - 0.1));
        showIndicator("[");
      } else if (e.key === "]") {
        e.preventDefault();
        setNodeSizeMultiplier(Math.min(3.0, project.nodeSizeMultiplier + 0.1));
        showIndicator("]");
      } else if (key === "d") {
        e.preventDefault();
        const modes: Array<"Freehand" | "Stamp" | "Edit"> = [
          "Freehand",
          "Stamp",
          "Edit",
        ];
        const currentIndex = modes.indexOf(project.drawMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        updateSettings({
          drawMode: modes[nextIndex] as "Freehand" | "Stamp" | "Edit",
        });
        showIndicator("D");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
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
    project.drawMode,
    project.nodeSizeMultiplier,
    setNodeSizeMultiplier,
    updateSettings,
  ]);

  // Handler functions
  const handleCanvasSizeChange = (values: [number, number]) => {
    updateSettings({ canvasSize: values });
  };

  const handleBackgroundColorChange = (value: string) => {
    updateSettings({ backgroundColor: value });
  };

  const handleDrawModeChange = (value: string) => {
    updateSettings({
      drawMode: value as "Freehand" | "Stamp" | "Edit",
    });
  };

  const handleFreehandSpacingChange = (value: number) => {
    updateSettings({ freehandSpacing: value });
  };

  const handleNodeSizeMultiplierChange = (value: number) => {
    setNodeSizeMultiplier(value);
  };

  const handleNodeColorChange = (value: string) => {
    updateSettings({ nodeColor: value });
  };

  const handleImageShuffleTypeChange = (value: string) => {
    updateSettings({
      imageShuffleType: value as "Duplicate Repeats" | "Random" | "Sequential",
    });
  };

  return (
    <section className={styles.settingsPane}>
      <div className="group tight">
        <DuoInput
          label="Canvas Size"
          values={project.canvasSize}
          onChange={handleCanvasSizeChange}
        />
        <ColorInput
          label="Background Color"
          value={project.backgroundColor}
          onChange={handleBackgroundColorChange}
        />
      </div>
      <div className="group">
        <RadioInput
          label="Draw Mode"
          values={["Freehand", "Stamp", "Edit"]}
          value={project.drawMode}
          onChange={handleDrawModeChange}
          shortcut={["D"]}
          triggeredKey={triggeredShortcut}
        />
        <RangeInput
          label="Freehand Spacing"
          value={project.freehandSpacing}
          clamp={[0.5, 10]}
          step={0.5}
          onChange={handleFreehandSpacingChange}
        />
      </div>
      <div className="group">
        <RangeInput
          label="Node Size"
          value={project.nodeSizeMultiplier}
          clamp={[0.2, 3.0]}
          step={0.1}
          onChange={handleNodeSizeMultiplierChange}
          shortcut={["[", "]"]}
          triggeredKey={triggeredShortcut}
        />
        <ColorInput
          label="Node Color"
          value={project.nodeColor}
          onChange={handleNodeColorChange}
        />
      </div>
      <div className="group">
        <SelectInput
          label="Image Shuffle Behavior"
          value={project.imageShuffleType}
          options={["Duplicate Repeats", "Random", "Sequential"]}
          onChange={handleImageShuffleTypeChange}
        />
      </div>
      <div className="group">
        <RangeInput
          label="Export Quality (GIF)"
          value={project.exportQualityGIF}
          clamp={[1, 30]}
          step={1}
          onChange={(value) => updateSettings({ exportQualityGIF: value })}
          showValueIndicator={true}
        />
        <RangeInput
          label="Export Quality (Video)"
          value={project.exportQualityVideo}
          clamp={[0.1, 1.0]}
          step={0.1}
          onChange={(value) => updateSettings({ exportQualityVideo: value })}
          showValueIndicator={true}
        />
      </div>
    </section>
  );
};

export default SettingsPane;
