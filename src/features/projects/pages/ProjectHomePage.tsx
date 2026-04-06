import { useState } from "react";
import { AutoSaveStatus } from "../../../app/components/AutoSaveStatus";
import { useCharacterStore } from "../../characters/store/useCharacterStore";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useLoreStore } from "../../lore/store/useLoreStore";
import { ProjectCreateForm } from "../components/ProjectCreateForm";
import { searchProjectContent } from "../lib/projectSearch";
import { buildProjectStats } from "../lib/projectStats";
import { useProjectStore } from "../store/useProjectStore";

export function ProjectHomePage() {
  const [routeName, setRouteName] = useState("");
  const [routeDrafts, setRouteDrafts] = useState<Record<string, string>>({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const currentProject = useProjectStore((state) => state.currentProject);
  const createProject = useProjectStore((state) => state.createProject);
  const createRoute = useProjectStore((state) => state.createRoute);
  const renameRoute = useProjectStore((state) => state.renameRoute);
  const editorScenes = useEditorStore((state) => state.scenes);
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
