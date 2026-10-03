"use client";

import { useEffect, useState } from "react";
import type { ExtraKey, TextKey } from "@/lib/i18n";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
};

export function InstallGuide({
  t,
  editing,
}: {
  t: (key: TextKey | ExtraKey) => string;
  editing: boolean;
}) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const ios = window.navigator as Navigator & { standalone?: boolean };
    const media = window.matchMedia("(display-mode: standalone)");
    const sync = () => setStandalone(media.matches || ios.standalone === true);
    const initial = window.setTimeout(sync, 0);
    media.addEventListener("change", sync);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    const network = window.setTimeout(() => {
      if (!navigator.onLine) setOffline(true);
    }, 0);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    if ("serviceWorker" in navigator && !import.meta.env.DEV) {
      void navigator.serviceWorker.getRegistration().then(
        (registration) => {
          if (!registration) return;
          if (registration.waiting && navigator.serviceWorker.controller)
            setUpdateReady(true);
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            worker?.addEventListener("statechange", () => {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setUpdateReady(true);
              }
            });
          });
        },
        () => undefined,
      );
    }
    return () => {
      window.clearTimeout(initial);
      window.clearTimeout(network);
      media.removeEventListener("change", sync);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return (
    <div className="stack no-print">
      {offline ? (
        <p className="notice error" role="status">
          {t("offlineBanner")}
        </p>
      ) : null}
      {updateReady ? (
        <p className="notice" role="status">
          {t("updateReady")}{" "}
          {editing ? (
            t("updateWhileEditing")
          ) : (
            <button
              className="btn"
              type="button"
              onClick={() => {
                const reload = () => window.location.reload();
                navigator.serviceWorker?.addEventListener(
                  "controllerchange",
                  reload,
                  { once: true },
                );
                void navigator.serviceWorker
                  ?.getRegistration()
                  .then((registration) => {
                    registration?.waiting?.postMessage("skip-waiting");
                  });
              }}
            >
              {t("updateNow")}
            </button>
          )}
        </p>
      ) : null}
      {standalone ? <p className="card">{t("installStandalone")}</p> : null}
      {standalone ? null : (
        <details className="card">
          <summary>{t("installTitle")}</summary>
          <div className="stack">
            <p>{t("installIntro")}</p>
            <p>{t("installIos")}</p>
            <p>{t("installAndroid")}</p>
            {prompt ? (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  void prompt.prompt();
                  setPrompt(null);
                }}
              >
                {t("installButton")}
              </button>
            ) : null}
          </div>
        </details>
      )}
    </div>
  );
}
