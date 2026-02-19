import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../../lib/auth";

// This handles ALL auth routes: /api/auth/*
const handler = toNextJsHandler(auth);

export const { GET, POST } = handler;