"use client";
import { createContext, useContext, ReactNode } from "react";
import { useProject } from "../hooks/useProject";

type ProjectContextType = ReturnType<typeof useProject>;

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const projectValue = useProject();
  return (
    <ProjectContext.Provider value={projectValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjectContext must be used within ProjectProvider");
  }
  return context;
}
