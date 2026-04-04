import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectHomePage } from "./ProjectHomePage";

describe("ProjectHomePage", () => {
  it("允许创建新项目并显示项目简介", async () => {
    const user = userEvent.setup();

    render(<ProjectHomePage />);

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("雨夜回响")).toBeInTheDocument();
    expect(screen.getByText("一段校园悬疑故事")).toBeInTheDocument();
  });
});
