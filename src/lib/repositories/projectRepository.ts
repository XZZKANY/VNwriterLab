import type { Project } from "../domain/project";

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  createProject(input: { name: string; summary: string }): Promise<Project>;
  updateProject(project: Project): Promise<void>;
}
