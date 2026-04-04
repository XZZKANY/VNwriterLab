import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { AppShell } from "../app/layouts/AppShell";

describe("V1 acceptance smoke", () => {
  it("导航中包含 V1 六个核心页面", () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <AppShell />,
        children: [{ index: true, element: <div>项目首页</div> }],
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByRole("link", { name: "项目首页" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "剧情编辑" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "分支图" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设定" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "预览" })).toBeInTheDocument();
  });
});
