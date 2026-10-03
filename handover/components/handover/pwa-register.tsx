"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => undefined);
  }, []);
  return null;
}
