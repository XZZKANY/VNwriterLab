import type { Scene } from "@/lib/domain/scene";
import type { EditorSceneUpdateInput } from "../store/editorStore.types";
import { SceneMetadataForm } from "./SceneMetadataForm";

interface EditorSceneInspectorProps {
  scene: Scene;
  onSceneUpdate: (input: EditorSceneUpdateInput) => void;
}

export function EditorSceneInspector({
  scene,
  onSceneUpdate,
}: EditorSceneInspectorProps) {
  return <SceneMetadataForm scene={scene} onUpdate={onSceneUpdate} />;
}
