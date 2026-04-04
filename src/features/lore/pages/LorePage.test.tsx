import { render, screen } from "@testing-library/react";
import { LorePage } from "./LorePage";

describe("LorePage", () => {
  it("显示设定页标题与分类入口", () => {
    render(<LorePage />);

    expect(screen.getByRole("heading", { name: "设定" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "地点" })).toBeInTheDocument();
  });
});
