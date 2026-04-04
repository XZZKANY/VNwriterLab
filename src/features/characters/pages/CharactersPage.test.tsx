import { render, screen } from "@testing-library/react";
import { CharactersPage } from "./CharactersPage";

describe("CharactersPage", () => {
  it("显示角色页标题与新增按钮", () => {
    render(<CharactersPage />);

    expect(screen.getByRole("heading", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增角色" })).toBeInTheDocument();
  });
});
