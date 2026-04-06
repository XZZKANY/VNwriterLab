import { FormEvent, useState } from "react";
import type { ProjectTemplate } from "../../../lib/domain/project";

interface ProjectCreateFormProps {
  onSubmit: (name: string, summary: string, template: ProjectTemplate) => void;
}

export function ProjectCreateForm({ onSubmit }: ProjectCreateFormProps) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [template, setTemplate] = useState<ProjectTemplate>("blank");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name, summary, template);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        项目名称
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        一句话简介
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </label>
      <label>
        项目模板
        <select
          aria-label="项目模板"
          value={template}
          onChange={(event) =>
            setTemplate(event.target.value as ProjectTemplate)
          }
        >
          <option value="blank">空白项目</option>
          <option value="linear_short">线性短篇</option>
          <option value="multi_ending">多结局</option>
          <option value="route_character">共通线 + 角色线</option>
        </select>
      </label>
      <button type="submit">创建项目</button>
    </form>
  );
}
