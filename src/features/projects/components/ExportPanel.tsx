import { useState } from "react";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import {
  buildProjectExportPayload,
  exportProjectAsEngineDraft,
  exportProjectAsJson,
  exportProjectAsPlainText,
} from "../lib/projectExport";

interface ExportPanelProps {
  project: Project;
  scenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
}

export function ExportPanel({
  project,
  scenes,
  links,
  variables,
}: ExportPanelProps) {
  const [exportContent, setExportContent] = useState("");
  const [exportTitle, setExportTitle] = useState("未生成导出内容");

  function buildPayload() {
    return buildProjectExportPayload({
      project,
      scenes,
      links,
      variables,
    });
  }

  function handleExportJson() {
    setExportTitle("结构化 JSON");
    setExportContent(exportProjectAsJson(buildPayload()));
  }

  function handleExportText() {
    setExportTitle("纯文本稿");
    setExportContent(exportProjectAsPlainText(buildPayload()));
  }

  function handleExportScript() {
    setExportTitle("引擎草稿脚本");
    setExportContent(exportProjectAsEngineDraft(buildPayload()));
  }

  return (
    <section aria-label="导出能力">
      <h4>导出能力</h4>
      <div>
        <button type="button" onClick={handleExportJson}>
          生成结构化 JSON
        </button>
        <button type="button" onClick={handleExportText}>
          生成纯文本稿
        </button>
        <button type="button" onClick={handleExportScript}>
          生成引擎草稿脚本
        </button>
      </div>
      <p>当前输出：{exportTitle}</p>
      <textarea
        aria-label="导出结果"
        readOnly
        value={exportContent}
        placeholder="点击上方按钮生成导出内容"
        style={{ width: "100%", minHeight: 180 }}
      />
    </section>
  );
}
