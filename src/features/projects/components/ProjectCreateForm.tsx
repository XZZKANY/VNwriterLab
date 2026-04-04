import { FormEvent, useState } from "react";

interface ProjectCreateFormProps {
  onSubmit: (name: string, summary: string) => void;
}

export function ProjectCreateForm({ onSubmit }: ProjectCreateFormProps) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name, summary);
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
      <button type="submit">创建项目</button>
    </form>
  );
}
