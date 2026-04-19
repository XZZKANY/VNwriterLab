import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AutoSaveStatus } from "../../../app/components/AutoSaveStatus";
import type { Scene } from "../../../lib/domain/scene";
import { useCharacterStore } from "../../characters/store/useCharacterStore";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useLoreStore } from "../../lore/store/useLoreStore";
import { ProjectCreateForm } from "../components/ProjectCreateForm";
import {
  buildProjectExportPayload,
  exportProjectAsEngineDraft,
  exportProjectAsJson,
  exportProjectAsPlainText,
} from "../lib/projectExport";
import { searchProjectContent } from "../lib/projectSearch";
import { buildProjectStats } from "../lib/projectStats";
import { useProjectStore } from "../store/useProjectStore";

const sceneStatusLabelMap = {
  draft: "草稿",
  completed: "已完成",
  needs_revision: "需修改",
  needs_supplement: "待补充",
  needs_logic_check: "待检查逻辑",
} as const;

function resolveRecentScene(scenes: Scene[], selectedSceneId: string | null) {
  if (selectedSceneId) {
    const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
    if (selectedScene) {
      return selectedScene;
    }
  }

  return scenes[scenes.length - 1] ?? null;
}

function resolveStartScene(scenes: Scene[]) {
  return (
    scenes.find((scene) => scene.isStartScene) ?? scenes[0] ?? null
  );
}

export function ProjectHomePage() {
  const navigate = useNavigate();
  const [routeName, setRouteName] = useState("");
  const [routeDrafts, setRouteDrafts] = useState<Record<string, string>>({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [exportContent, setExportContent] = useState("");
  const [exportTitle, setExportTitle] = useState("未生成导出内容");
  const currentProject = useProjectStore((state) => state.currentProject);
  const hydrateLatestProject = useProjectStore(
    (state) => state.hydrateLatestProject,
  );
  const createProject = useProjectStore((state) => state.createProject);
  const createRoute = useProjectStore((state) => state.createRoute);
  const renameRoute = useProjectStore((state) => state.renameRoute);
  const editorScenes = useEditorStore((state) => state.scenes);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const selectScene = useEditorStore((state) => state.selectScene);
  const links = useEditorStore((state) => state.links);
  const variables = useEditorStore((state) => state.variables);
  const characters = useCharacterStore((state) => state.characters);
  const loreEntries = useLoreStore((state) => state.entries);

  const sortedRoutes = [...(currentProject?.routes ?? [])].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  });

  const sceneCountByRoute = new Map(
    sortedRoutes.map((route) => [
      route.id,
      currentProject?.scenes.filter((scene) => scene.routeId === route.id)
        .length ?? 0,
    ]),
  );

  const projectStats = currentProject
    ? buildProjectStats({
        project: currentProject,
        editorScenes,
        links,
        variables,
        characters,
        loreEntries,
      })
    : null;

  const mergedSceneMap = new Map(
    (currentProject?.scenes ?? []).map((scene) => [scene.id, scene] as const),
  );
  editorScenes
    .filter((scene) => scene.projectId === currentProject?.id)
    .forEach((scene) => {
      mergedSceneMap.set(scene.id, scene);
    });

  const availableScenes = [...mergedSceneMap.values()].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.title.localeCompare(right.title, "zh-CN");
  });
  const projectLinks = currentProject
    ? links.filter((link) => link.projectId === currentProject.id)
    : [];
  const projectVariables = currentProject
    ? variables.filter((variable) => variable.projectId === currentProject.id)
    : [];

  const recentScene = resolveRecentScene(availableScenes, selectedSceneId);
  const startScene = resolveStartScene(availableScenes) ?? recentScene;
  const recentRoute =
    sortedRoutes.find((route) => route.id === recentScene?.routeId) ?? null;

  const searchResults =
    currentProject && searchKeyword.trim()
      ? searchProjectContent(searchKeyword, {
          project: currentProject,
          editorScenes,
          characters,
          loreEntries,
        })
      : null;

  const hasSearchResults = Boolean(
    searchResults &&
      (searchResults.sceneResults.length > 0 ||
        searchResults.characterResults.length > 0 ||
        searchResults.loreResults.length > 0),
  );

  useEffect(() => {
    if (!currentProject) {
      void hydrateLatestProject();
    }
  }, [currentProject, hydrateLatestProject]);

  function handleContinueWriting() {
    if (!recentScene) {
      return;
    }

    selectScene(recentScene.id);
    navigate("/editor");
  }

  function handleOpenGraph() {
    if (recentScene) {
      selectScene(recentScene.id);
    }

    navigate("/graph");
  }

  function handleStartPreview() {
    if (startScene) {
      selectScene(startScene.id);
    }

    navigate("/preview");
  }

  function buildExportPayload() {
    if (!currentProject) {
      return null;
    }

    return buildProjectExportPayload({
      project: currentProject,
      scenes: availableScenes,
      links: projectLinks,
      variables: projectVariables,
    });
  }

  function handleExportJson() {
    const payload = buildExportPayload();
    if (!payload) {
      return;
    }

    setExportTitle("结构化 JSON");
    setExportContent(exportProjectAsJson(payload));
  }

  function handleExportText() {
    const payload = buildExportPayload();
    if (!payload) {
      return;
    }

    setExportTitle("纯文本稿");
    setExportContent(exportProjectAsPlainText(payload));
  }

  function handleExportScript() {
    const payload = buildExportPayload();
    if (!payload) {
      return;
    }

    setExportTitle("引擎草稿脚本");
    setExportContent(exportProjectAsEngineDraft(payload));
  }

  return (
    <section>
      <h2>项目首页</h2>
      <AutoSaveStatus />
      {!currentProject ? (
        <ProjectCreateForm onSubmit={createProject} />
      ) : (
        <div>
          <h3>{currentProject.name}</h3>
          <p>{currentProject.summary}</p>
          <p>默认路线：{sortedRoutes[0]?.name}</p>
          {projectStats ? (
            <section aria-label="项目统计">
              <h4>项目统计</h4>
              <ul>
                <li>路线数：{projectStats.routeCount}</li>
                <li>场景总数：{projectStats.sceneCount}</li>
                <li>结局场景数：{projectStats.endingSceneCount}</li>
                <li>变量数：{projectStats.variableCount}</li>
                <li>角色数：{projectStats.characterCount}</li>
                <li>设定数：{projectStats.loreCount}</li>
                <li>问题场景数：{projectStats.issueSceneCount}</li>
              </ul>
            </section>
          ) : null}
          <section aria-label="最近编辑">
            <h4>最近编辑</h4>
            {recentScene ? (
              <div>
                <p>
                  <strong>{recentScene.title}</strong>
                </p>
                <p>所属路线：{recentRoute?.name ?? "未分配路线"}</p>
                <p>当前状态：{sceneStatusLabelMap[recentScene.status]}</p>
                <p>{recentScene.summary.trim() || "当前场景还没有摘要。"}</p>
                <div aria-label="快捷动作">
                  <button type="button" onClick={handleContinueWriting}>
                    继续写作
                  </button>
                  <button type="button" onClick={handleOpenGraph}>
                    打开分支图
                  </button>
                  <button type="button" onClick={handleStartPreview}>
                    从头预览
                  </button>
                </div>
              </div>
            ) : (
              <p>暂无可继续创作的场景。</p>
            )}
          </section>
          <ul aria-label="项目路线列表">
            {sortedRoutes.map((route) => {
              const draftValue = routeDrafts[route.id] ?? route.name;

              return (
                <li key={route.id}>
                  <strong>{route.name}</strong>
                  <span> 场景数：{sceneCountByRoute.get(route.id) ?? 0}</span>
                  <label>
                    路线名称
                    <input
                      aria-label="路线名称"
                      value={draftValue}
                      onChange={(event) =>
                        setRouteDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [route.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      renameRoute(route.id, draftValue);
                      setRouteDrafts((currentDrafts) => {
                        const nextDrafts = { ...currentDrafts };
                        delete nextDrafts[route.id];
                        return nextDrafts;
                      });
                    }}
                  >
                    保存路线名称
                  </button>
                </li>
              );
            })}
          </ul>
          <label>
            新路线名称
            <input
              aria-label="新路线名称"
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              createRoute(routeName);
              setRouteName("");
            }}
          >
            新增路线
          </button>
          <section aria-label="导出能力">
            <h4>导出能力</h4>
            <div>
              <button type="button" onClick={handleExportJson}>
                生成结构化 JSON
              </button>
              <button type="button" onClick={handleExportText}>
                生成纯文本稿
              </button>
              <button type="button" onClick={handleExportScript}>
                生成引擎草稿脚本
              </button>
            </div>
            <p>当前输出：{exportTitle}</p>
            <textarea
              aria-label="导出结果"
              readOnly
              value={exportContent}
              placeholder="点击上方按钮生成导出内容"
              style={{ width: "100%", minHeight: 180 }}
            />
          </section>
          <section aria-label="项目全局搜索">
            <h4>项目全局搜索</h4>
            <label>
              搜索关键词
              <input
                aria-label="搜索关键词"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </label>
            {searchResults ? (
              hasSearchResults ? (
                <div>
                  <h5>搜索结果</h5>
                  <section aria-label="场景搜索结果">
                    <h6>场景</h6>
                    {searchResults.sceneResults.length > 0 ? (
                      <ul>
                        {searchResults.sceneResults.map((result) => (
                          <li key={result.sceneId}>
                            <strong>{result.sceneTitle}</strong>
                            <div>命中字段：{result.matchedFields.join("、")}</div>
                            <div>命中摘要：{result.snippet}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>未命中任何场景。</p>
                    )}
                  </section>
                  <section aria-label="角色搜索结果">
                    <h6>角色</h6>
                    {searchResults.characterResults.length > 0 ? (
                      <ul>
                        {searchResults.characterResults.map((result) => (
                          <li key={result.characterId}>
                            <strong>{result.characterName}</strong>
                            <div>命中字段：{result.matchedFields.join("、")}</div>
                            <div>命中摘要：{result.snippet}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>未命中任何角色。</p>
                    )}
                  </section>
                  <section aria-label="设定搜索结果">
                    <h6>设定</h6>
                    {searchResults.loreResults.length > 0 ? (
                      <ul>
                        {searchResults.loreResults.map((result) => (
                          <li key={result.loreId}>
                            <strong>{result.loreName}</strong>
                            <div>命中字段：{result.matchedFields.join("、")}</div>
                            <div>命中摘要：{result.snippet}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>未命中任何设定。</p>
                    )}
                  </section>
                </div>
              ) : (
                <p>未找到匹配内容。</p>
              )
            ) : null}
          </section>
        </div>
      )}
    </section>
  );
}
