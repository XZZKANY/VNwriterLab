import type { Edge, Node } from "reactflow";

export interface SceneGraphConditionSummary {
  sceneId: string;
  sceneTitle: string;
  linkId: string;
  linkLabel: string;
  summary: string;
}

export type SceneGraphIssueCode =
  | "emptyScene"
  | "contentGap"
  | "noIncoming"
  | "noOutgoing"
  | "unresolvedForeshadow"
  | "missingConditionVariable"
  | "deletedConditionVariable"
  | "missingTargetScene"
  | "deletedEffectVariable";

export interface SceneGraphIssue {
  code: SceneGraphIssueCode;
  category: string;
  message: string;
}

export interface SceneGraphIssueSummary {
  sceneId: string;
  sceneTitle: string;
  categories: string[];
  issues: string[];
}

export interface SceneGraphNodeData {
  label: string;
  routeId: string;
  isStartScene: boolean;
  isEndingScene: boolean;
  /** 仅在 buildSceneGraph 接收 routes 时填充 */
  routeName?: string;
  sceneType?: "normal" | "branch" | "ending";
  status?:
    | "draft"
    | "completed"
    | "needs_revision"
    | "needs_supplement"
    | "needs_logic_check";
  statusLabel?: string;
  hasIssue?: boolean;
  blockCount?: number;
  incomingCount?: number;
  outgoingCount?: number;
}

export interface SceneGraphViewFilters {
  routeFilter: "all" | "single";
  routeId: string | null;
  questionOnly: boolean;
}

export interface SceneGraphData {
  nodes: Node<SceneGraphNodeData>[];
  edges: Edge[];
  conditionSummaries: SceneGraphConditionSummary[];
  issueSummaries: SceneGraphIssueSummary[];
}
