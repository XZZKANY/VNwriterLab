import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { useProjectStore } from "../store/useProjectStore";
import { ProjectHomePage } from "./ProjectHomePage";

describe("ProjectHomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().resetProject();
    useAutoSaveStore.getState().reset();
    cleanup();
  });

  it("允许创建新项目并显示项目简介", async () => {
    const user = userEvent.setup();

    render(<ProjectHomePage />);

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("雨夜回响")).toBeInTheDocument();
    expect(screen.getByText("一段校园悬疑故事")).toBeInTheDocument();
  });

  it("创建项目后显示自动保存状态", async () => {
    const user = userEvent.setup();

    render(<ProjectHomePage />);

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByRole("status")).toHaveTextContent("已自动保存");
  });

  it("重载后会恢复已保存项目并显示恢复提示", async () => {
    const { useProjectStore } = await import("../store/useProjectStore");

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    vi.resetModules();

    const { ProjectHomePage: ReloadedProjectHomePage } = await import("./ProjectHomePage");

    render(<ReloadedProjectHomePage />);

    expect(screen.getByText("雨夜回响")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("已恢复本地草稿");
  });
});
