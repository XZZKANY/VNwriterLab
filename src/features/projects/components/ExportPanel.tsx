import { useState } from "react";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { saveTextFile } from "@/lib/fileTransfer";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import {
  buildProjectExportPayload,
  exportProjectAsEngineDraft,
  exportProjectAsJson,
  exportProjectAsPlainText,
} from "../lib/projectExport";
import { sanitizeProjectNameForFile } from "../lib/projectFileName";

interface ExportPanelProps {
  project: Project;
  scenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
}

interface ExportFormat {
  /** 在 textarea 标题里展示 */
  title: string;
  /** 文件扩展名 */
  extension: "json" | "txt" | "rpy";
  /** 保存对话框里展示的格式描述 */
  formatDescription: string;
  /** 序列化函数 */
  serialize: (payload: ReturnType<typeof buildProjectExportPayload>) => string;
}

const EXPORT_FORMATS = {
  json: {
    title: "结构化 JSON",
    extension: "json",
    formatDescription: "结构化 JSON",
    serialize: exportProjectAsJson,
  },
  text: {
    title: "纯文本稿",
    extension: "txt",
    formatDescription: "纯文本",
    serialize: exportProjectAsPlainText,
  },
  script: {
    title: "引擎草稿脚本",
    extension: "rpy",
    formatDescription: "引擎草稿脚本",
    serialize: exportProjectAsEngineDraft,
  },
} as const satisfies Record<string, ExportFormat>;

type ExportFormatKey = keyof typeof EXPORT_FORMATS;

export function ExportPanel({
  project,
  scenes,
  links,
  variables,
}: ExportPanelProps) {
  const [exportContent, setExportContent] = useState("");
  const [exportTitle, setExportTitle] = useState("未生成导出内容");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  function buildPayload() {
    return buildProjectExportPayload({
      project,
      scenes,
      links,
      variables,
    });
  }

  function previewFormat(formatKey: ExportFormatKey) {
    const format = EXPORT_FORMATS[formatKey];
    const content = format.serialize(buildPayload());
    setExportTitle(format.title);
    setExportContent(content);
    setSaveStatus(null);
  }

  async function saveFormatToFile(formatKey: ExportFormatKey) {
    const format = EXPORT_FORMATS[formatKey];
    const content = format.serialize(buildPayload());
    const defaultName = sanitizeProjectNameForFile(project.name);

    setSaveStatus(`正在保存 ${format.title}…`);
    try {
      const result = await saveTextFile({
        defaultName,
        extension: format.extension,
        formatDescription: format.formatDescription,
        content,
      });

      if (!result.saved) {
        setSaveStatus("已取消保存。");
        return;
      }

      setSaveStatus(
        result.path
          ? `已保存到 ${result.path}`
          : `已生成 ${defaultName}.${format.extension} 下载文件`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveStatus(`保存失败：${message}`);
    }
  }

  return (
    <section aria-label="导出能力">
      <h4>导出能力</h4>
      <div>
        <button type="button" onClick={() => previewFormat("json")}>
          生成结构化 JSON
        </button>
        <button type="button" onClick={() => previewFormat("text")}>
          生成纯文本稿
        </button>
        <button type="button" onClick={() => previewFormat("script")}>
          生成引擎草稿脚本
        </button>
      </div>
      <div>
        <button type="button" onClick={() => saveFormatToFile("json")}>
          保存为 JSON 文件
        </button>
        <button type="button" onClick={() => saveFormatToFile("text")}>
          保存为 TXT 文件
        </button>
        <button type="button" onClick={() => saveFormatToFile("script")}>
          保存为 RPY 文件
        </button>
      </div>
      <p>当前输出：{exportTitle}</p>
      {saveStatus ? <p role="status">{saveStatus}</p> : null}
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
