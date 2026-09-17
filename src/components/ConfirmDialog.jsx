import Modal from "./Modal";
import Button from "./Button";
import { T, sans } from "../styles/tokens";

/* Yes/no confirmation. `danger` styles the confirm button in the warn colour. */
export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <p className="text-[13.5px] leading-relaxed mb-6" style={{ ...sans, color: T.black, opacity: 0.75 }}>{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
