import mongoose from "mongoose";
import { ANALYSIS_MODULES, MODULE_STATUSES } from "../lib/validation.js";

/*
  One analysis record per project, holding the state of every module.

  `data` and `meta` are Mixed because each module returns a different
  shape (see data/analysisSchemas.js) — the model's own JSON schema is
  what constrains them. `status` is the part that must stay disciplined,
  so it is an enum.
*/
const moduleSchema = new mongoose.Schema(
  {
    status: { type: String, enum: MODULE_STATUSES, default: "idle" },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    updatedAt: { type: Number, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

function emptyModules() {
  return Object.fromEntries(ANALYSIS_MODULES.map((m) => [m, { status: "idle", data: null, error: null, updatedAt: null, meta: null }]));
}

const analysisSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
      index: true,
    },
    modules: {
      type: Object.fromEntries(ANALYSIS_MODULES.map((m) => [m, { type: moduleSchema, default: () => ({}) }])),
      default: emptyModules,
    },
  },
  { timestamps: true },
);

analysisSchema.statics.emptyModules = emptyModules;

export const Analysis = mongoose.model("Analysis", analysisSchema);
