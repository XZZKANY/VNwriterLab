import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";

export interface ProjectExportPayload {
  project: Project;
  scenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
}

export function buildProjectExportPayload(input: {
  project: Project;
  scenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
}): ProjectExportPayload {
  return {
    project: input.project,
    scenes: [...input.scenes].sort(
      (left, right) => left.sortOrder - right.sortOrder,
    ),
    links: [...input.links].sort(
      (left, right) => left.priorityOrder - right.priorityOrder,
    ),
    variables: [...input.variables].sort((left, right) =>
      left.name.localeCompare(right.name, "zh-CN"),
    ),
  };
}

export function exportProjectAsJson(payload: ProjectExportPayload) {
  return JSON.stringify(payload, null, 2);
}

export function exportProjectAsPlainText(payload: ProjectExportPayload) {
  const lines: string[] = [];
  lines.push(`# 项目：${payload.project.name}`);
  lines.push(`简介：${payload.project.summary || "无"}`);
  lines.push("");

  payload.project.routes
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((route) => {
      lines.push(`## 路线：${route.name}`);
      const routeScenes = payload.scenes
        .filter((scene) => scene.routeId === route.id)
        .sort((left, right) => left.sortOrder - right.sortOrder);

      if (routeScenes.length === 0) {
        lines.push("- 暂无场景");
        lines.push("");
        return;
      }

      routeScenes.forEach((scene) => {
        lines.push(`- 场景：${scene.title}`);
        lines.push(`  摘要：${scene.summary || "无"}`);
      });
      lines.push("");
    });

  return lines.join("\n").trim();
}

export function exportProjectAsEngineDraft(payload: ProjectExportPayload) {
  const lines: string[] = [];
  lines.push(`# Engine Draft - ${payload.project.name}`);
  lines.push("");

  payload.project.routes
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((route) => {
      lines.push(`# route ${route.name}`);
      payload.scenes
        .filter((scene) => scene.routeId === route.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .forEach((scene) => {
          lines.push(`label ${scene.id}:`);
          if (scene.summary.trim()) {
            lines.push(`  # ${scene.summary.trim()}`);
          }
          scene.blocks
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .forEach((block) => {
              if (!block.contentText.trim()) {
                return;
              }
              lines.push(`  "${block.contentText.trim()}"`);
            });
          lines.push("  return");
          lines.push("");
        });
    });

  return lines.join("\n").trim();
}
