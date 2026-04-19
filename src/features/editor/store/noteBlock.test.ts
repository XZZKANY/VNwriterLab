import { describe, expect, it } from "vitest";
import {
  parseNoteBlockMeta,
  stringifyNoteBlockMeta,
} from "./noteBlock";

describe("noteBlock", () => {
  it("解析异常值时返回默认普通注释", () => {
    expect(parseNoteBlockMeta("invalid")).toEqual({
      noteType: "general",
      threadId: null,
    });
  });

  it("会标准化线索编号并保留伏笔类型", () => {
    const parsed = parseNoteBlockMeta(
      JSON.stringify({
        noteType: "foreshadow",
        threadId: "  old-school-key  ",
      }),
    );

    expect(parsed).toEqual({
      noteType: "foreshadow",
      threadId: "old-school-key",
    });
  });

  it("序列化时会清理空线索编号", () => {
    const payload = stringifyNoteBlockMeta({
      noteType: "payoff",
      threadId: "   ",
    });

    expect(JSON.parse(payload)).toEqual({
      noteType: "payoff",
      threadId: null,
    });
  });
});
