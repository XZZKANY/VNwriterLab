import type { Scene } from "./scene";

export type ProjectTemplate =
  | "blank"
  | "linear_short"
  | "multi_ending"
  | "route_character";

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

function createTemplateScene(input: {
  projectId: string;
  routeId: string;
  title: string;
  sortOrder: number;
  isEndingScene?: boolean;
}): Scene {
  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    routeId: input.routeId,
    title: input.title,
    summary: "",
    sceneType: input.isEndingScene ? "ending" : "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: input.sortOrder,
    isStartScene: input.sortOrder === 0,
    isEndingScene: input.isEndingScene ?? false,
    notes: "",
    blocks: [],
  };
}

function createTemplateProject(
  projectId: string,
  name: string,
  summary: string,
  template: Exclude<ProjectTemplate, "blank">,
): Project {
  if (template === "linear_short") {
    const routeId = crypto.randomUUID();

    return {
      id: projectId,
      name,
      summary,
      projectType: "linear",
      routes: [
        {
          id: routeId,
          projectId,
          name: "主线",
          routeType: "common",
          description: "线性短篇默认主线",
          sortOrder: 0,
        },
      ],
      scenes: [
        createTemplateScene({
          projectId,
          routeId,
          title: "开场",
          sortOrder: 0,
        }),
      ],
    };
  }

  if (template === "multi_ending") {
    const routeId = crypto.randomUUID();

    return {
      id: projectId,
      name,
      summary,
      projectType: "multi_ending",
      routes: [
        {
          id: routeId,
          projectId,
          name: "主线",
          routeType: "common",
          description: "多结局模板主线",
          sortOrder: 0,
        },
      ],
      scenes: [
        createTemplateScene({
          projectId,
          routeId,
          title: "开场",
          sortOrder: 0,
        }),
        createTemplateScene({
          projectId,
          routeId,
          title: "普通结局",
          sortOrder: 1,
          isEndingScene: true,
        }),
        createTemplateScene({
          projectId,
          routeId,
          title: "真结局",
          sortOrder: 2,
          isEndingScene: true,
        }),
      ],
    };
  }

  const commonRouteId = crypto.randomUUID();
  const characterRouteId1 = crypto.randomUUID();
  const characterRouteId2 = crypto.randomUUID();

  return {
    id: projectId,
    name,
    summary,
    projectType: "route_based",
    routes: [
      {
        id: commonRouteId,
        projectId,
        name: "共通线",
        routeType: "common",
        description: "角色线汇合前的共通剧情",
        sortOrder: 0,
      },
      {
        id: characterRouteId1,
        projectId,
        name: "角色线 1",
        routeType: "character",
        description: "角色线模板 1",
        sortOrder: 1,
      },
      {
        id: characterRouteId2,
        projectId,
        name: "角色线 2",
        routeType: "character",
        description: "角色线模板 2",
        sortOrder: 2,
      },
    ],
    scenes: [
      createTemplateScene({
        projectId,
        routeId: commonRouteId,
        title: "共通线开场",
        sortOrder: 0,
      }),
      createTemplateScene({
        projectId,
        routeId: characterRouteId1,
        title: "角色线 1 开场",
        sortOrder: 0,
      }),
      createTemplateScene({
        projectId,
        routeId: characterRouteId2,
        title: "角色线 2 开场",
        sortOrder: 0,
      }),
    ],
  };
}

export function createRoute(input: {
  projectId: string;
  name: string;
  sortOrder: number;
}): Route {
  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    name: input.name,
    routeType: "character",
    description: `${input.name}的路线`,
    sortOrder: input.sortOrder,
  };
}

export function createSceneInRoute(input: {
  projectId: string;
  routeId: string;
  sortOrder: number;
}): Scene {
  const nextIndex = input.sortOrder + 1;

  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    routeId: input.routeId,
    title: `未命名场景 ${nextIndex}`,
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: input.sortOrder,
    isStartScene: input.sortOrder === 0,
    isEndingScene: false,
    notes: "",
    blocks: [],
  };
}

export function createEmptyProject(
  name: string,
  summary: string,
  template: ProjectTemplate = "blank",
): Project {
  const projectId = crypto.randomUUID();

  if (template !== "blank") {
    return createTemplateProject(projectId, name, summary, template);
  }

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
