import mongoose from "mongoose";
import { ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES } from "../lib/validation.js";

/*
  An uploaded research document.

  The file itself lives on disk under UPLOAD_DIR; this record holds the
  metadata plus the outcome of text extraction, which is what decides
  whether the document can take part in an analysis.
*/
const documentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 400 },
    type: {
      type: String,
      required: true,
      uppercase: true,
      validate: {
        validator: (v) => ACCEPTED_EXTENSIONS.includes(String(v).toLowerCase()),
        message: (p) => `${p.value} is not a supported document type.`,
      },
    },
    bytes: {
      type: Number,
      required: true,
      min: [1, "File is empty."],
      max: [MAX_UPLOAD_BYTES, "File is larger than 25 MB."],
    },
    size: { type: String, required: true }, // human-readable, e.g. "2.4 MB"
    status: { type: String, enum: ["Processed", "Failed"], default: "Processed" },
    storedName: { type: String, required: true }, // filename on disk

    extraction: { type: String, enum: ["extracted", "failed"], required: true },
    extractionError: { type: String, default: null },
    extractionMethod: { type: String, default: null },
    chars: { type: Number, default: 0, min: 0 },
    pages: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.projectId = ret.project?.toString();
        ret.createdAt = new Date(ret.createdAt).getTime();
        delete ret._id;
        delete ret.__v;
        delete ret.project;
        delete ret.owner;
        delete ret.storedName; // server-side path detail
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

documentSchema.index({ project: 1, createdAt: 1 });

export const Document = mongoose.model("Document", documentSchema);
