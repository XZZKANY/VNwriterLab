import { isTauri } from "@tauri-apps/api/core";

/**
 * 跨环境的文件读写适配层。
 *
 * - 在 Tauri 桌面进程内：用原生保存/打开对话框 + plugin-fs 读写文件
 * - 在普通浏览器或单元测试 (jsdom) 内：用 <a download> 下载或
 *   <input type="file"> 文件选择回退
 *
 * 这一层把 ExportPanel / ImportPanel 与 @tauri-apps/plugin-* 解耦：
 * UI 组件只依赖本文件，测试时不需要 mock 任何 Tauri 模块。
 */

export interface SaveTextFileOptions {
  /** 默认文件名（不含扩展名） */
  defaultName: string;
  /** 文件扩展名，不含点，例如 "json" / "txt" / "rpy" */
  extension: string;
  /** 在原生对话框里展示的格式描述，例如 "结构化 JSON" */
  formatDescription: string;
  /** 要写入的文本内容 */
  content: string;
}

export interface SaveTextFileResult {
  /** 实际选用的实现路径 */
  via: "tauri" | "web";
  /** Tauri 下用户选择的绝对路径；web 下永远为 null */
  path: string | null;
  /** 是否成功写入（用户取消时为 false） */
  saved: boolean;
}

export interface PickAndReadTextFileOptions {
  /** 允许的扩展名，不含点 */
  extension: string;
  /** 在原生对话框里展示的格式描述 */
  formatDescription: string;
}

export interface PickAndReadTextFileResult {
  via: "tauri" | "web";
  /** Tauri 下用户选中的绝对路径；web 下为 null */
  path: string | null;
  /** 文件名（含扩展名） */
  fileName: string;
  /** 文件文本内容 */
  content: string;
}

/**
 * 把字符串内容保存到本地文件。
 *
 * Tauri 桌面：弹出原生保存对话框；用户取消时返回 `{ saved: false }`，
 * 否则用 plugin-fs 写入并返回绝对路径。
 *
 * 浏览器/jsdom：触发 `<a download>` 把内容当作 Blob 下载。
 * 在 jsdom 里 click 不会真正写盘，但调用本身不会抛错——便于测试覆盖。
 */
export async function saveTextFile(
  options: SaveTextFileOptions,
): Promise<SaveTextFileResult> {
  if (isTauri()) {
    return saveTextFileViaTauri(options);
  }

  return saveTextFileViaWeb(options);
}

/**
 * 弹出文件选择对话框，读取并返回选中的文本文件。
 * 用户取消时返回 null。
 */
export async function pickAndReadTextFile(
  options: PickAndReadTextFileOptions,
): Promise<PickAndReadTextFileResult | null> {
  if (isTauri()) {
    return pickAndReadTextFileViaTauri(options);
  }

  return pickAndReadTextFileViaWeb(options);
}

// ---- Tauri 实现 -----------------------------------------------------------

async function saveTextFileViaTauri(
  options: SaveTextFileOptions,
): Promise<SaveTextFileResult> {
  const [{ save }, { writeTextFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);

  const path = await save({
    defaultPath: `${options.defaultName}.${options.extension}`,
    filters: [
      {
        name: options.formatDescription,
        extensions: [options.extension],
      },
    ],
  });

  if (path === null) {
    return { via: "tauri", path: null, saved: false };
  }

  await writeTextFile(path, options.content);

  return { via: "tauri", path, saved: true };
}

async function pickAndReadTextFileViaTauri(
  options: PickAndReadTextFileOptions,
): Promise<PickAndReadTextFileResult | null> {
  const [{ open }, { readTextFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);

  const selection = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: options.formatDescription,
        extensions: [options.extension],
      },
    ],
  });

  if (selection === null) {
    return null;
  }

  // Tauri 2 plugin-dialog 的 open(multiple: false) 直接返回路径字符串
  const path = selection;
  const fileName = path.split(/[\\/]/).pop() ?? path;
  const content = await readTextFile(path);

  return { via: "tauri", path, fileName, content };
}

// ---- Web / jsdom 实现 -----------------------------------------------------

const BLOB_MIME_BY_EXTENSION: Record<string, string> = {
  json: "application/json",
  txt: "text/plain",
  rpy: "text/plain",
};

function saveTextFileViaWeb(options: SaveTextFileOptions): SaveTextFileResult {
  const fileName = `${options.defaultName}.${options.extension}`;
  const mime =
    BLOB_MIME_BY_EXTENSION[options.extension] ?? "application/octet-stream";
  const blob = new Blob([options.content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // jsdom 里 revokeObjectURL 不存在的话会抛，捕掉防止意外
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }

  return { via: "web", path: null, saved: true };
}

function pickAndReadTextFileViaWeb(
  options: PickAndReadTextFileOptions,
): Promise<PickAndReadTextFileResult | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = `.${options.extension}`;
    input.style.display = "none";

    let settled = false;

    input.addEventListener("change", () => {
      if (settled) {
        return;
      }
      settled = true;

      const file = input.files?.[0] ?? null;
      input.remove();

      if (!file) {
        resolve(null);
        return;
      }

      file
        .text()
        .then((content) => {
          resolve({
            via: "web",
            path: null,
            fileName: file.name,
            content,
          });
        })
        .catch(reject);
    });

    document.body.appendChild(input);
    input.click();
  });
}
