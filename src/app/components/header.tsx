"use client";
import React, { useState, useRef, useEffect } from "react";
import h_styles from "../styles/layout.module.css";
import IndentedArrowIcon from "./icons/indented-arrow";
import ChevronDown from "./icons/chevron-down";
import Download from "./icons/download";
import { useProjectContext } from "../context/ProjectContext";
import { exportAsGIF, exportAsVideo, downloadBlob } from "../utils/export";

const Header = () => {
  const { project } = useProjectContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<"GIF" | "Video" | null>(null);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "success" | "error"
  >("idle");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleExportGIF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportType("GIF");
    setExportStatus("exporting");
    setIsDropdownOpen(false);

    // Clear any existing timeout
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    try {
      const blob = await exportAsGIF(project, (progress) => {
        setExportProgress(progress);
      });
      downloadBlob(blob, `animation-${Date.now()}.gif`);
      setExportStatus("success");
      // Auto-hide success message after 3 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setExportStatus("idle");
        setExportType(null);
      }, 3000);
    } catch (error) {
      console.error("Error exporting GIF:", error);
      setExportStatus("error");
      // Auto-hide error message after 5 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setExportStatus("idle");
        setExportType(null);
      }, 5000);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportType("Video");
    setExportStatus("exporting");
    setIsDropdownOpen(false);

    // Clear any existing timeout
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    try {
      const blob = await exportAsVideo(project, (progress) => {
        setExportProgress(progress);
      });
      downloadBlob(blob, `animation-${Date.now()}.webm`);
      setExportStatus("success");
      // Auto-hide success message after 3 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setExportStatus("idle");
        setExportType(null);
      }, 3000);
    } catch (error) {
      console.error("Error exporting video:", error);
      setExportStatus("error");
      // Auto-hide error message after 5 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setExportStatus("idle");
        setExportType(null);
      }, 5000);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className={h_styles.header}>
      <div className="group">
        <h1>nonsoanetoh/</h1>
        <p>
          <IndentedArrowIcon />
          nodes/
        </p>
      </div>
      <div className={h_styles.exportContainer} ref={dropdownRef}>
        <button
          className={h_styles.exportButton}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isExporting}
        >
          <Download />
          <span>Export</span>
          <ChevronDown
            style={{
              transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        </button>
        {isDropdownOpen && (
          <div className={h_styles.dropdown}>
            <button
              className={h_styles.dropdownItem}
              onClick={handleExportGIF}
              disabled={isExporting}
            >
              <Download />
              <span>
                {isExporting
                  ? `Exporting GIF... ${Math.round(exportProgress * 100)}%`
                  : "Export GIF"}
              </span>
            </button>
            <button
              className={h_styles.dropdownItem}
              onClick={handleExportVideo}
              disabled={isExporting}
            >
              <Download />
              <span>
                {isExporting
                  ? `Exporting Video... ${Math.round(exportProgress * 100)}%`
                  : "Export Video"}
              </span>
            </button>
          </div>
        )}
        {/* Export Status Indicator */}
        {exportStatus !== "idle" && (
          <div className={h_styles.exportStatus}>
            {exportStatus === "exporting" && (
              <div className={h_styles.exportStatusContent}>
                <div className={h_styles.exportSpinner}></div>
                <span>
                  Exporting {exportType}... {Math.round(exportProgress * 100)}%
                </span>
              </div>
            )}
            {exportStatus === "success" && (
              <div
                className={`${h_styles.exportStatusContent} ${h_styles.exportStatusSuccess}`}
              >
                <span>✓ {exportType} exported successfully!</span>
              </div>
            )}
            {exportStatus === "error" && (
              <div
                className={`${h_styles.exportStatusContent} ${h_styles.exportStatusError}`}
              >
                <span>✗ Failed to export {exportType}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
