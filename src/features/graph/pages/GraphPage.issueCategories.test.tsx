import { cleanup, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
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
    expect(
      within(issueSummary).getByText("问题分类：空场景、无出口"),
    ).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("当前场景还没有任何内容块"),
    ).toBeInTheDocument();
  });

  it("会显示内容缺失分类和问题文案", () => {
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
          title: "待补正文场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: true,
          notes: "",
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "note",
              sortOrder: 0,
              characterId: null,
              contentText: "   ",
              metaJson: null,
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "   ",
                targetSceneId: null,
                effectVariableId: null,
                effectValue: 0,
              }),
            },
          ],
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

    expect(within(issueSummary).getByText("待补正文场景")).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("问题分类：内容缺失"),
    ).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("当前场景还没有任何有效正文或选项文案"),
    ).toBeInTheDocument();
  });
});
