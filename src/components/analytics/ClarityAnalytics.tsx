"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

/** Module-level so React 19 StrictMode's double-effect can't init twice. */
let started = false;

/**
 * Microsoft Clarity — heatmaps and session replay. Loads only in the browser,
 * only when NEXT_PUBLIC_CLARITY_PROJECT_ID is set, so local runs and previews
 * without the id stay out of the production project's data.
 */
export function ClarityAnalytics() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  useEffect(() => {
    if (!projectId || started) return;
    started = true;
    Clarity.init(projectId);
  }, [projectId]);

  return null;
}
