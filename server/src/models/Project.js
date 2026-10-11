import mongoose from "mongoose";

/*
  A research project: the container for a user's documents and analysis.

  owner is indexed because every query is scoped to the signed-in user;
  the compound index with createdAt serves the project list directly.
*/
const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Project name is required."],
      trim: true,
      minlength: [2, "Give the project a name of at least 2 characters."],
      maxlength: [120, "Project name is too long."],
    },
    objective: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Objective must be at most 1000 characters."],
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.createdAt = new Date(ret.createdAt).getTime();
        ret.updatedAt = new Date(ret.updatedAt).getTime();
        delete ret._id;
        delete ret.__v;
        delete ret.owner;
        return ret;
      },
    },
  },
);

projectSchema.index({ owner: 1, createdAt: -1 });

export const Project = mongoose.model("Project", projectSchema);
