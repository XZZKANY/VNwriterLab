import {
  createEmptyProject,
  type Project,
  type ProjectTemplate,
} from "../domain/project";
import type { ProjectRepository } from "./projectRepository";
import { createSqliteProjectRepository } from "./sqliteProjectRepository";

function createVolatileProjectRepository(): ProjectRepository {
  const projects = new Map<string, Project>();

  return {
    async listProjects() {
      return [...projects.values()];
    },
    async getProject(projectId) {
      return projects.get(projectId) ?? null;
    },
    async createProject(input) {
      const project =
        input.project ??
        createEmptyProject(
          input.name,
          input.summary,
          input.template as ProjectTemplate | undefined,
        );
      projects.set(project.id, project);
      return project;
    },
    async updateProject(project) {
      projects.set(project.id, project);
    },
  };
}

let projectRepositoryOverride: ProjectRepository | null = null;
let projectRepositorySingleton: ProjectRepository | null = null;

function canUseSqliteRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function getProjectRepository() {
  if (projectRepositoryOverride) {
    return projectRepositoryOverride;
  }

  if (!projectRepositorySingleton) {
    projectRepositorySingleton = canUseSqliteRuntime()
      ? createSqliteProjectRepository()
      : createVolatileProjectRepository();
  }

  return projectRepositorySingleton;
}

export function setProjectRepositoryForTesting(repository: ProjectRepository) {
  projectRepositoryOverride = repository;
}

export function resetProjectRepositoryForTesting() {
  projectRepositoryOverride = null;
  projectRepositorySingleton = null;
}
