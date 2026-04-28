import { describe, expect, it } from "vitest";
import {
  createSqliteTimestamp,
  fromSqliteBoolean,
  SQLITE_PROJECT_STATUS,
  toSqliteBoolean,
} from "./sqliteRepositoryUtils";

describe("toSqliteBoolean", () => {
  it("true → 1", () => {
    expect(toSqliteBoolean(true)).toBe(1);
  });

  it("false → 0", () => {
    expect(toSqliteBoolean(false)).toBe(0);
  });
});

describe("fromSqliteBoolean", () => {
  it("接受真布尔值", () => {
    expect(fromSqliteBoolean(true)).toBe(true);
    expect(fromSqliteBoolean(false)).toBe(false);
  });

  it("数字 1 / 0 与 SQLite 等价表示", () => {
    expect(fromSqliteBoolean(1)).toBe(true);
    expect(fromSqliteBoolean(0)).toBe(false);
  });

  it("正数全部视为 true", () => {
    expect(fromSqliteBoolean(2)).toBe(true);
    expect(fromSqliteBoolean(0.5)).toBe(true);
  });

  it("负数视为 false（不是真的预期路径，但不应抛错）", () => {
    expect(fromSqliteBoolean(-1)).toBe(false);
  });

  it("字符串 '1' 与 '0' 经 Number 转换得到正确布尔", () => {
    expect(fromSqliteBoolean("1")).toBe(true);
    expect(fromSqliteBoolean("0")).toBe(false);
  });

  it("无法解析为数字的字符串视为 false（NaN > 0 为 false）", () => {
    expect(fromSqliteBoolean("not a number")).toBe(false);
  });

  it("null / undefined 视为 false", () => {
    expect(fromSqliteBoolean(null)).toBe(false);
    expect(fromSqliteBoolean(undefined)).toBe(false);
  });
});

describe("createSqliteTimestamp", () => {
  it("返回 ISO 8601 格式字符串", () => {
    const value = createSqliteTimestamp();
    // 形如 2026-04-27T15:50:32.000Z
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("返回值可被 Date 反向解析", () => {
    const value = createSqliteTimestamp();
    expect(Number.isNaN(new Date(value).getTime())).toBe(false);
  });

  it("两次调用返回值不应回退（单调递增或相等）", () => {
    const first = createSqliteTimestamp();
    const second = createSqliteTimestamp();
    expect(new Date(second).getTime()).toBeGreaterThanOrEqual(
      new Date(first).getTime(),
    );
  });
});

describe("SQLITE_PROJECT_STATUS 常量", () => {
  it('为 "draft"', () => {
    expect(SQLITE_PROJECT_STATUS).toBe("draft");
  });
});
