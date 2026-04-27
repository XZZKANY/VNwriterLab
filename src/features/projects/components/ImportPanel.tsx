import { useState } from "react";
import { pickAndReadTextFile } from "@/lib/fileTransfer";
import { parseProjectImport } from "../lib/projectImport";
import type { ProjectImportInput } from "../store/projectStore.types";

interface ImportPanelProps {
  /** 由 useProjectStore.importProject 提供 */
  onImport: (input: ProjectImportInput) => void;
}

/**
 * 项目导入面板：
 * - 用户点击"从本地文件导入项目" → 弹出文件选择对话框
 * - 选中文件后读出文本，用 parseProjectImport 校验结构
 * - 校验通过则调用 onImport 把项目装载到双 store + 异步落盘
 *
 * 失败的所有路径（取消、JSON 错误、字段错误）都通过 status 文案告知用户。
 */
export function ImportPanel({ onImport }: ImportPanelProps) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleImport() {
    setStatus("正在打开文件…");

    let picked: Awaited<ReturnType<typeof pickAndReadTextFile>>;
    try {
      picked = await pickAndReadTextFile({
        extension: "json",
        formatDescription: "结构化 JSON",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`打开文件失败：${message}`);
      return;
    }

    if (!picked) {
      setStatus("已取消导入。");
      return;
    }

    const result = parseProjectImport(picked.content);
    if (!result.ok) {
      setStatus(`导入失败：${result.error}`);
      return;
    }

    try {
      onImport(result.payload);
      setStatus(
        `已导入项目「${result.payload.project.name}」（${picked.fileName}）。`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`导入应用到状态时出错：${message}`);
    }
  }

  return (
    <section aria-label="导入能力">
      <h4>导入能力</h4>
      <p>从之前用「保存为 JSON 文件」导出的备份还原项目。</p>
      <button type="button" onClick={handleImport}>
        从本地文件导入项目
      </button>
      {status ? <p role="status">{status}</p> : null}
    </section>
  );
}
