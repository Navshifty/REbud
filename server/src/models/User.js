import mongoose from "mongoose";
import { MIN_PASSWORD_LENGTH } from "../lib/validation.js";

/*
  A researcher's account.

  Validation lives on the schema so it holds however a document is
  written — through a route, a maintenance script, or a seed. The
  password hash is select:false, so it is never returned unless a query
  asks for it explicitly.
*/
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Enter your full name."],
      trim: true,
      minlength: [2, "Enter your full name."],
      maxlength: [120, "Name is too long."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

/* Minimum password length is enforced before hashing (see auth.service),
   since the schema only ever sees the hash. Exported for that check. */
userSchema.statics.MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH;

export const User = mongoose.model("User", userSchema);
