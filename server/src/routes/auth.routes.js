import { Router } from "express";
import { asyncHandler } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { login, publicUser, signup } from "../services/auth.service.js";

const router = Router();

/** POST /api/auth/signup { name, email, password } → { token, user } */
router.post("/signup", asyncHandler(async (req, res) => {
  const result = await signup(req.body ?? {});
  res.status(201).json(result);
}));

/** POST /api/auth/login { email, password } → { token, user } */
router.post("/login", asyncHandler(async (req, res) => {
  res.json(await login(req.body ?? {}));
}));

/** GET /api/auth/me → user */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
