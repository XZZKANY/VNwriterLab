import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import type { ProjectExportPayload } from "./projectExport";

/**
 * 项目导入解析结果。
 * 解析失败时 payload 为 null，error 给出可向用户展示的中文原因。
 */
export type ProjectImportResult =
  | { ok: true; payload: ProjectExportPayload }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProjectShape(value: unknown): value is Project {
  if (!isObject(value)) return false;

  const projectType = value.projectType;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.summary === "string" &&
    (projectType === "linear" ||
      projectType === "multi_ending" ||
      projectType === "route_based") &&
    Array.isArray(value.routes) &&
    Array.isArray(value.scenes)
  );
}

function isSceneArray(value: unknown): value is Scene[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (scene) =>
      isObject(scene) &&
      typeof scene.id === "string" &&
      typeof scene.projectId === "string" &&
      typeof scene.routeId === "string" &&
      Array.isArray(scene.blocks),
  );
}

function isLinkArray(value: unknown): value is SceneLink[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (link) =>
      isObject(link) &&
      typeof link.id === "string" &&
      typeof link.projectId === "string" &&
      typeof link.fromSceneId === "string" &&
      typeof link.toSceneId === "string",
  );
}

function isVariableArray(value: unknown): value is ProjectVariable[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (variable) =>
      isObject(variable) &&
      typeof variable.id === "string" &&
      typeof variable.projectId === "string" &&
      typeof variable.name === "string",
  );
}

/**
 * 解析一段 JSON 字符串为 ProjectExportPayload。
 * 校验顶层结构：必须有 project / scenes / links / variables 四项。
 *
 * 注意：本函数不会深度校验每个字段（例如 sceneType / status 的合法值），
 * 只做"足够不让运行时崩溃"的轻量校验。深度校验建议放在更上层。
 */
export function parseProjectImport(raw: string): ProjectImportResult {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { ok: false, error: "导入内容为空。" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `JSON 解析失败：${message}` };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: "顶层应为对象。" };
  }

  if (!("project" in parsed)) {
    return { ok: false, error: "缺少 project 字段。" };
  }
  if (!("scenes" in parsed)) {
    return { ok: false, error: "缺少 scenes 字段。" };
  }
  if (!("links" in parsed)) {
    return { ok: false, error: "缺少 links 字段。" };
  }
  if (!("variables" in parsed)) {
    return { ok: false, error: "缺少 variables 字段。" };
  }

  if (!isProjectShape(parsed.project)) {
    return { ok: false, error: "project 字段结构非法。" };
  }
  if (!isSceneArray(parsed.scenes)) {
    return { ok: false, error: "scenes 字段结构非法。" };
  }
  if (!isLinkArray(parsed.links)) {
    return { ok: false, error: "links 字段结构非法。" };
  }
  if (!isVariableArray(parsed.variables)) {
    return { ok: false, error: "variables 字段结构非法。" };
  }

  // 校验 projectId 一致性：scenes/links/variables 必须都属于 project.id
  const projectId = parsed.project.id;
  if (parsed.scenes.some((scene) => scene.projectId !== projectId)) {
    return {
      ok: false,
      error: "存在 scene 的 projectId 与 project.id 不一致。",
    };
  }
  if (parsed.links.some((link) => link.projectId !== projectId)) {
    return {
      ok: false,
      error: "存在 link 的 projectId 与 project.id 不一致。",
    };
  }
  if (parsed.variables.some((variable) => variable.projectId !== projectId)) {
    return {
      ok: false,
      error: "存在 variable 的 projectId 与 project.id 不一致。",
    };
  }

  return {
    ok: true,
    payload: {
      project: parsed.project,
      scenes: parsed.scenes,
      links: parsed.links,
      variables: parsed.variables,
    },
  };
}
