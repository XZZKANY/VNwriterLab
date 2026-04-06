import { cleanup, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { GraphPage } from "./GraphPage";

describe("GraphPage issue categories", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({ currentProject: null });
    useEditorStore.getState().resetEditor();
    cleanup();
  });

  it("会显示问题分类并保留问题描述", () => {
    useProjectStore.setState({
      currentProject: {
        id: "p1",
        name: "雨夜回响",
        summary: "",
        projectType: "route_based",
        routes: [
          {
            id: "r1",
            projectId: "p1",
            name: "共通线",
            routeType: "common",
            description: "",
            sortOrder: 0,
          },
        ],
        scenes: [],
      },
    });

    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "空白场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      links: [],
      selectedSceneId: "s1",
      variables: [],
    });

    render(
      <MemoryRouter initialEntries={["/graph"]}>
        <Routes>
          <Route path="/graph" element={<GraphPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const issueSummary = screen.getByRole("region", { name: "问题明细" });

    expect(within(issueSummary).getByText("空白场景")).toBeInTheDocument();
    expect(within(issueSummary).getByText("问题分类：空场景、无出口")).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("当前场景还没有任何内容块"),
    ).toBeInTheDocument();
  });
});
