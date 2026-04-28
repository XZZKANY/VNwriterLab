/**
 * 把项目名归一化为合法的文件名前缀，目标是同时满足 Windows / macOS / Linux：
 *
 * - 移除 Windows 不允许的字符：`< > : " / \ | ? *`
 * - 过滤所有 ASCII 控制字符（0x00–0x1F，包括换行/制表符等）
 * - 压缩连续空白为单个空格
 * - 去掉首尾空白和首尾的点（Windows 不允许文件名以点结尾）
 * - 截断到 64 个 UTF-16 code unit 以避免过长文件名
 * - 全部去除后为空字符串则退化为「未命名项目」
 *
 * 该函数只关心文件名前缀，不附带扩展名。调用方负责拼接 `.${extension}`。
 */
export function sanitizeProjectNameForFile(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*]/g, "")
    // 控制字符（ASCII 0x00-0x1f）：用单独的 char-code 过滤，避免在 regex
    // 中嵌入控制字符触发 eslint no-control-regex
    .split("")
    .filter((ch) => ch.charCodeAt(0) >= 0x20)
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 64);

  return cleaned || "未命名项目";
}
