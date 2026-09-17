import { useState } from "react";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Field from "../components/Field";
import TextInput from "../components/TextInput";
import { T, sans } from "../styles/tokens";

/*
  Create or edit a project (name + research objective).
  Pass `project` to edit; omit it to create.
*/
export default function ProjectDialog({ project, onSubmit, onClose }) {
  const editing = Boolean(project);
  const [name, setName] = useState(project?.name ?? "");
  const [objective, setObjective] = useState(project?.objective ?? "");
  const [error, setError] = useState(null);

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Give the project a name of at least 2 characters.");
      return;
    }
    onSubmit({ name: trimmed, objective: objective.trim() });
  }

  return (
    <Modal title={editing ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Project name" error={error}>
          <TextInput
            value={name}
            error={error}
            placeholder="e.g. Cortical Visual Prosthesis"
            onChange={(e) => { setName(e.target.value); setError(null); }}
          />
        </Field>
        <Field label="Research objective (optional)">
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={3}
            placeholder="One or two sentences on what this research sets out to do. REbud uses it to contextualise analysis."
            className="w-full px-3.5 py-2.5 text-[14px] bg-white outline-none resize-y"
            style={{ border: `1px solid ${T.line}`, color: T.black, ...sans }}
          />
        </Field>
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editing ? "Save changes" : "Create project"}</Button>
        </div>
      </form>
    </Modal>
  );
}
