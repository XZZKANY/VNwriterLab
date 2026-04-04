import type { Scene } from "./scene";

export interface Route {
  id: string;
  projectId: string;
  name: string;
  routeType: "common" | "character" | "true_end" | "bad_end" | "hidden";
  description: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  projectType: "linear" | "multi_ending" | "route_based";
  routes: Route[];
  scenes: Scene[];
}

export function createEmptyProject(name: string, summary: string): Project {
  const projectId = crypto.randomUUID();
  const routeId = crypto.randomUUID();

  return {
    id: projectId,
    name,
    summary,
    projectType: "route_based",
    routes: [
      {
        id: routeId,
        projectId,
        name: "共通线",
        routeType: "common",
        description: "默认创建的起始路线",
        sortOrder: 0,
      },
    ],
    scenes: [],
  };
}
