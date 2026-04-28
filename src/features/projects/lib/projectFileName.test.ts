import { describe, expect, it } from "vitest";
import { sanitizeProjectNameForFile } from "./projectFileName";

const TAB = String.fromCharCode(9);
const LF = String.fromCharCode(10);
const NUL = String.fromCharCode(0);

describe("sanitizeProjectNameForFile", () => {
  it("普通中文名原样保留", () => {
    expect(sanitizeProjectNameForFile("rainy night")).toBe("rainy night");
  });

  it("移除 Windows 不允许的全部字符", () => {
    expect(sanitizeProjectNameForFile('a<b>c:d"e/f\\g|h?i*j')).toBe(
      "abcdefghij",
    );
  });

  it("过滤所有 ASCII 控制字符", () => {
    const withControls = "name" + TAB + LF + NUL + "tail";
    expect(sanitizeProjectNameForFile(withControls)).toBe("nametail");
  });

  it("压缩多空白为单个空格", () => {
    expect(sanitizeProjectNameForFile("a  b   c   d")).toBe("a b c d");
  });

  it("去掉首尾空白", () => {
    expect(sanitizeProjectNameForFile("   trim me   ")).toBe("trim me");
  });

  it("去掉首尾的点（Windows 限制）", () => {
    expect(sanitizeProjectNameForFile("...name...")).toBe("name");
    expect(sanitizeProjectNameForFile(".hidden.")).toBe("hidden");
  });

  it("中间的点保留", () => {
    expect(sanitizeProjectNameForFile("a.b.c")).toBe("a.b.c");
  });

  it("截断到最多 64 个 code unit", () => {
    const long = "a".repeat(120);
    expect(sanitizeProjectNameForFile(long)).toHaveLength(64);
  });

  it("空字符串与全无效字符回退为「未命名项目」", () => {
    expect(sanitizeProjectNameForFile("")).toBe("未命名项目");
    expect(sanitizeProjectNameForFile("   ")).toBe("未命名项目");
    expect(sanitizeProjectNameForFile("???")).toBe("未命名项目");
    expect(sanitizeProjectNameForFile("...")).toBe("未命名项目");
  });

  it("Windows 字符 + 控制字符 + 多空白 + 首尾点 一并清理", () => {
    const messy = "  ..ab|cd<>ef" + TAB + "gh:..  ";
    // 1) 去 Windows 字符（| < > :）→ "  ..abcdef" + TAB + "gh..  "
    // 2) 去控制字符（TAB）→ "  ..abcdefgh..  "
    // 3) 多空白合一 → " ..abcdefgh.. "
    // 4) trim → "..abcdefgh.."
    // 5) 首尾点剥离 → "abcdefgh"
    expect(sanitizeProjectNameForFile(messy)).toBe("abcdefgh");
  });
});
