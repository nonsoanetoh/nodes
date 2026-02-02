"use client";
import React, { useState, useRef, useEffect } from "react";
import h_styles from "../styles/layout.module.css";
import IndentedArrowIcon from "./icons/indented-arrow";
import ChevronDown from "./icons/chevron-down";
import Download from "./icons/download";
import { useProjectContext } from "../context/ProjectContext";
import {
  exportAsGIF,
  exportAsVideo,
  exportAsJSON,
  downloadBlob,
} from "../utils/export";

const Header = () => {
  const {
    project,
    createNewProject,
    deleteCurrentProject,
    updateProjectName,
    importProject,
    currentSlot,
    switchSlot,
    getProjectsList,
  } = useProjectContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<"GIF" | "Video" | "JSON" | null>(
    null,
  );
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "success" | "error"
  >("idle");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsExportDropdownOpen(false);
      }
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
    };

    if (isExportDropdownOpen || isProjectDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportDropdownOpen, isProjectDropdownOpen]);

  const handleExportGIF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportType("GIF");
    setExportStatus("exporting");
    setIsExportDropdownOpen(false);

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
    setIsExportDropdownOpen(false);

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

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const importedProject = JSON.parse(reader.result as string);
        importProject(importedProject);
        setIsExportDropdownOpen(false);
        setExportStatus("success");
        setExportType("JSON");
        statusTimeoutRef.current = setTimeout(() => {
          setExportStatus("idle");
          setExportType(null);
        }, 3000);
      } catch (error) {
        console.error("Error importing JSON:", error);
        setExportStatus("error");
        setExportType("JSON");
        statusTimeoutRef.current = setTimeout(() => {
          setExportStatus("idle");
          setExportType(null);
        }, 5000);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <header className={h_styles.header}>
      <div className="group">
        <h1>nonsoanetoh/</h1>
        <p>
          <IndentedArrowIcon />
          nodes/
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <div className={h_styles.exportContainer} ref={projectDropdownRef}>
          <button
            className={h_styles.exportButton}
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          >
            <span>{mounted ? project.name : "Untitled"}</span>
            <ChevronDown
              style={{
                transform: isProjectDropdownOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </button>
          {isProjectDropdownOpen && (
            <div className={h_styles.dropdown}>
              <button
                className={h_styles.dropdownItem}
                onClick={() => {
                  const name = prompt("Enter project name:", "Untitled");
                  if (name !== null) {
                    createNewProject(name || "Untitled");
                    setIsProjectDropdownOpen(false);
                  }
                }}
              >
                <span>Create New Project</span>
              </button>
              {getProjectsList().filter(
                (p) => !p.isEmpty && p.slot !== currentSlot,
              ).length > 0 && (
                <>
                  <div
                    style={{
                      borderTop: "1px solid #e0e0e0",
                      margin: "0.5rem 0",
                    }}
                  />
                  {getProjectsList()
                    .filter((p) => !p.isEmpty && p.slot !== currentSlot)
                    .map((p) => (
                      <button
                        key={p.slot}
                        className={h_styles.dropdownItem}
                        onClick={() => {
                          switchSlot(p.slot);
                          setIsProjectDropdownOpen(false);
                        }}
                      >
                        <span>{p.name}</span>
                      </button>
                    ))}
                </>
              )}
              <div
                style={{ borderTop: "1px solid #e0e0e0", margin: "0.5rem 0" }}
              />
              <button
                className={h_styles.dropdownItem}
                onClick={() => {
                  const newName = prompt("Rename project:", project.name);
                  if (newName !== null && newName.trim()) {
                    updateProjectName(newName.trim());
                    setIsProjectDropdownOpen(false);
                  }
                }}
              >
                <span>Rename Project</span>
              </button>
              <button
                className={h_styles.dropdownItem}
                onClick={() => {
                  if (
                    confirm(`Delete "${project.name}"? This cannot be undone.`)
                  ) {
                    deleteCurrentProject();
                    setIsProjectDropdownOpen(false);
                  }
                }}
                style={{ color: "#ff0000" }}
              >
                <span>Delete Project</span>
              </button>
            </div>
          )}
        </div>
        <div className={h_styles.exportContainer} ref={dropdownRef}>
          <button
            className={h_styles.exportButton}
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            disabled={isExporting}
          >
            <Download />
            <span>Export</span>
            <ChevronDown
              style={{
                transform: isExportDropdownOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </button>
          {isExportDropdownOpen && (
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
              <button
                className={h_styles.dropdownItem}
                onClick={() => {
                  exportAsJSON(project);
                  setIsExportDropdownOpen(false);
                }}
                disabled={isExporting}
              >
                <Download />
                <span>Export JSON</span>
              </button>
              <button
                className={h_styles.dropdownItem}
                onClick={handleImportJSON}
                disabled={isExporting}
              >
                <Download />
                <span>Import JSON</span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {/* Export Status Indicator */}
          {exportStatus !== "idle" && (
            <div className={h_styles.exportStatus}>
              {exportStatus === "exporting" && (
                <div className={h_styles.exportStatusContent}>
                  <div className={h_styles.exportSpinner}></div>
                  <span>
                    Exporting {exportType}... {Math.round(exportProgress * 100)}
                    %
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
      </div>
    </header>
  );
};

export default Header;
