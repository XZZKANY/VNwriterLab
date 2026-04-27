import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pickAndReadTextFile, saveTextFile } from "./fileTransfer";

// jsdom 里默认没有 URL.createObjectURL，需要 polyfill 一下
function mockObjectUrl() {
  const created: string[] = [];
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => {
      const url = `blob:test-${created.length}`;
      created.push(url);
      return url;
    }),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  return created;
}

describe("fileTransfer (web 回退路径)", () => {
  let originalCreate: PropertyDescriptor | undefined;
  let originalRevoke: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalCreate = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    originalRevoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
  });

  afterEach(() => {
    if (originalCreate) {
      Object.defineProperty(URL, "createObjectURL", originalCreate);
    } else {
      delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL;
    }
    if (originalRevoke) {
      Object.defineProperty(URL, "revokeObjectURL", originalRevoke);
    } else {
      delete (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL;
    }
  });

  it("saveTextFile 在非 Tauri 下走 web 路径并触发下载锚点", async () => {
    mockObjectUrl();

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const result = await saveTextFile({
      defaultName: "雨夜回响",
      extension: "json",
      formatDescription: "结构化 JSON",
      content: '{"hello":"world"}',
    });

    expect(result.via).toBe("web");
    expect(result.path).toBeNull();
    expect(result.saved).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it("saveTextFile 触发后会清理 anchor 元素", async () => {
    mockObjectUrl();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const initialAnchors = document.querySelectorAll("a").length;
    await saveTextFile({
      defaultName: "test",
      extension: "txt",
      formatDescription: "纯文本",
      content: "hello",
    });

    expect(document.querySelectorAll("a").length).toBe(initialAnchors);
  });

  it("pickAndReadTextFile 在用户没选文件时返回 null", async () => {
    const promise = pickAndReadTextFile({
      extension: "json",
      formatDescription: "结构化 JSON",
    });

    // 模拟用户选择对话框未选文件，change 事件 files 为空
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
    Object.defineProperty(input!, "files", {
      value: [],
      configurable: true,
    });
    input!.dispatchEvent(new Event("change"));

    await expect(promise).resolves.toBeNull();
  });

  it("pickAndReadTextFile 选中文件后返回内容与文件名", async () => {
    const promise = pickAndReadTextFile({
      extension: "json",
      formatDescription: "结构化 JSON",
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    const file = new File(['{"name":"林夏"}'], "林夏存档.json", {
      type: "application/json",
    });
    Object.defineProperty(input!, "files", {
      value: [file],
      configurable: true,
    });
    input!.dispatchEvent(new Event("change"));

    const result = await promise;

    expect(result).not.toBeNull();
    expect(result?.via).toBe("web");
    expect(result?.path).toBeNull();
    expect(result?.fileName).toBe("林夏存档.json");
    expect(result?.content).toBe('{"name":"林夏"}');
  });
});
