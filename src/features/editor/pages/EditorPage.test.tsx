import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { useEditorStore } from "../store/useEditorStore";
import { EditorPage } from "./EditorPage";

describe("EditorPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.getState().resetEditor();
    useAutoSaveStore.getState().reset();
    cleanup();
  });

  it("允许创建场景并追加旁白块", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));

    expect(screen.getByText("未命名场景 1")).toBeInTheDocument();
    expect(screen.getByLabelText("旁白内容")).toBeInTheDocument();
  });

  it("编辑后显示自动保存状态", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));

    expect(screen.getByRole("status")).toHaveTextContent("已自动保存");
  });

  it("重载后会恢复已保存场景并显示恢复提示", async () => {
    const { useEditorStore } = await import("../store/useEditorStore");

    useEditorStore.getState().createScene();
    useEditorStore.getState().addBlock("narration");

    vi.resetModules();

    const { EditorPage: ReloadedEditorPage } = await import("./EditorPage");

    render(<ReloadedEditorPage />);

    expect(screen.getByText("未命名场景 1")).toBeInTheDocument();
    expect(screen.getByLabelText("旁白内容")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("已恢复本地草稿");
  });
});
