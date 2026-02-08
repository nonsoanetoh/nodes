"use client";
import React, { FC, useState, useEffect, useRef } from "react";
import styles from "../../styles/settings.module.css";
import { RangeInputProps } from "../../types/settings";

const RangeInput: FC<RangeInputProps> = ({
  label,
  value,
  clamp,
  step,
  shortcut,
  triggeredKey,
  showValueIndicator,
  onChange,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<number>(value);
  const [indicatorPosition, setIndicatorPosition] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted on client before rendering value-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setInputValue(value);
    }
  }, [value, mounted]);

  useEffect(() => {
    if (showValueIndicator && sliderRef.current) {
      const slider = sliderRef.current;
      const min = clamp[0];
      const max = clamp[1];
      const percentage = ((inputValue - min) / (max - min)) * 100;
      const sliderWidth = slider.offsetWidth;
      const thumbWidth = 4; // Match CSS thumb width
      const position = (percentage / 100) * sliderWidth;
      setIndicatorPosition(Math.max(0, Math.min(position, sliderWidth)));
    }
  }, [inputValue, clamp, showValueIndicator, isDragging]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(e.target.value);
    setInputValue(numValue);
    onChange(numValue);
  };

  const handleIndicatorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !showValueIndicator) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const sliderWidth = sliderRef.current.offsetWidth;
      const min = clamp[0];
      const max = clamp[1];

      const percentage = Math.max(0, Math.min(1, x / sliderWidth));
      const newValue = Math.round(min + percentage * (max - min));
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      setInputValue(clampedValue);
      onChange(clampedValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, showValueIndicator, clamp, step, onChange]);

  // Use stable placeholder when !mounted so server and client HTML match (avoid hydration mismatch).
  // Only show numeric value after mount; before that show a neutral placeholder so SSR and first client paint match.
  const displayValue = mounted ? inputValue : clamp[0];
  const valueText = mounted ? `${inputValue} / ${clamp[1]}` : "–";
  const percentage = ((displayValue - clamp[0]) / (clamp[1] - clamp[0])) * 100;

  return (
    <div className={`${styles.setting}`}>
      <div className="setting__range-input">
        <div className="row">
          <label className="setting__label" htmlFor={`${label}--ri`}>
            {label}
          </label>
          <div className="setting__shortcut-indicator">
            {shortcut?.map((key, i) => {
              return (
                <span
                  key={i}
                  className={triggeredKey === key ? "triggered" : ""}
                >
                  {key}
                </span>
              );
            })}
          </div>
        </div>
        <div className="input-container" ref={containerRef}>
          {showValueIndicator && (
            <div
              ref={indicatorRef}
              className="value-indicator"
              style={{
                left: `${indicatorPosition}px`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleIndicatorMouseDown}
            >
              <span className="value-text">
                {valueText}
              </span>
              <div className="value-arrow" />
            </div>
          )}
          <input
            ref={sliderRef}
            type="range"
            value={mounted ? inputValue : clamp[0]}
            min={clamp[0]}
            max={clamp[1]}
            step={step}
            onChange={handleInputChange}
            className={showValueIndicator ? "with-indicator" : ""}
          />
          {showValueIndicator && (
            <div className="track-overlay">
              <div
                className="track-filled"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RangeInput;
