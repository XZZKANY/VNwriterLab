import type { Project } from "../domain/project";
import type { ProjectTemplate } from "../domain/project";

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  createProject(input: {
    name: string;
    summary: string;
    template?: ProjectTemplate;
    project?: Project;
  }): Promise<Project>;
  updateProject(project: Project): Promise<void>;
}
