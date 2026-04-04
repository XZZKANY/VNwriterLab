import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorPage } from "./EditorPage";

describe("EditorPage", () => {
  it("允许创建场景并追加旁白块", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));

    expect(screen.getByText("未命名场景 1")).toBeInTheDocument();
    expect(screen.getByLabelText("旁白内容")).toBeInTheDocument();
  });
});
