import { render, screen } from "@testing-library/react";
import { GraphPage } from "./GraphPage";

describe("GraphPage", () => {
  it("显示结构图页标题与问题筛选入口", () => {
    render(<GraphPage />);

    expect(
      screen.getByRole("heading", { name: "分支图" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("只看问题节点")).toBeInTheDocument();
  });
});
