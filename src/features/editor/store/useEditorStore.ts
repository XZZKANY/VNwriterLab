import { create } from "zustand";
import { createEditorStoreState } from "./createEditorStoreState";
import type { EditorStoreState } from "./editorStore.types";

export const EDITOR_STORAGE_KEY = "vn-writer-lab.editor-store";

export const useEditorStore = create<EditorStoreState>()((...args) =>
  createEditorStoreState(...args),
);
