import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("显示基础导航", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "项目首页" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "剧情编辑" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "分支图" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设定" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "预览" })).toBeInTheDocument();
  });
});
