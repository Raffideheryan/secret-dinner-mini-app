export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export type TelegramViewportSnapshot = {
  height: number;
  stableHeight: number;
  keyboardInset: number;
};

export function getTelegramInitData(): string {
  const app = getTelegramWebApp();
  return app?.initData ?? import.meta.env.VITE_TELEGRAM_INIT_DATA_OVERRIDE ?? "";
}

export function getTelegramDevUserId(): string {
  return import.meta.env.VITE_TELEGRAM_DEV_USER_ID ?? "";
}

export function applyTelegramTheme(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();
  if (webApp.requestFullscreen && !webApp.isFullscreen) {
    try {
      webApp.requestFullscreen();
    } catch {
      // Older Telegram clients may reject fullscreen requests even though
      // expand() still works, so keep the Mini App usable without failing.
    }
  }

  const theme = webApp.themeParams;
  const root = document.documentElement;
  if (theme.bg_color) {
    root.style.setProperty("--tg-bg", theme.bg_color);
  }
  if (theme.secondary_bg_color) {
    root.style.setProperty("--tg-surface", theme.secondary_bg_color);
  }
  if (theme.text_color) {
    root.style.setProperty("--tg-text", theme.text_color);
  }
  if (theme.hint_color) {
    root.style.setProperty("--tg-muted", theme.hint_color);
  }
  if (theme.button_color) {
    root.style.setProperty("--tg-button", theme.button_color);
  }
  if (theme.button_text_color) {
    root.style.setProperty("--tg-button-text", theme.button_text_color);
  }
  if (webApp.setBackgroundColor) {
    webApp.setBackgroundColor("#08110e");
  }
  if (webApp.setHeaderColor) {
    webApp.setHeaderColor("#0b1512");
  }
}

function readViewportSnapshot(): TelegramViewportSnapshot {
  const webApp = getTelegramWebApp();
  const visualViewport = window.visualViewport;
  const fallbackHeight = window.innerHeight;

  const telegramViewportHeight =
    typeof webApp?.viewportHeight === "number" && webApp.viewportHeight > 0
      ? webApp.viewportHeight
      : null;
  const telegramStableHeight =
    typeof webApp?.stableHeight === "number" && webApp.stableHeight > 0
      ? webApp.stableHeight
      : null;

  const visualHeight = visualViewport?.height ?? fallbackHeight;
  const visualOffsetTop = visualViewport?.offsetTop ?? 0;

  const height = telegramViewportHeight ?? visualHeight;
  const stableHeight = telegramStableHeight ?? Math.max(fallbackHeight, visualHeight);
  const keyboardInset = Math.max(
    0,
    Math.round(
      Math.max(stableHeight - height, fallbackHeight - visualHeight - visualOffsetTop),
    ),
  );

  return {
    height: Math.round(height),
    stableHeight: Math.round(stableHeight),
    keyboardInset,
  };
}

export function observeTelegramViewport(
  onChange: (snapshot: TelegramViewportSnapshot) => void,
): () => void {
  const webApp = getTelegramWebApp();
  let lastSnapshotKey = "";
  let debounceTimer: number | null = null;

  const emitSnapshot = () => {
    const snapshot = readViewportSnapshot();
    const snapshotKey = `${snapshot.height}:${snapshot.stableHeight}:${snapshot.keyboardInset}`;
    if (snapshotKey === lastSnapshotKey) {
      return;
    }
    lastSnapshotKey = snapshotKey;
    onChange(snapshot);
  };

  const handleChange = () => {
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      emitSnapshot();
    }, 60);
  };

  webApp?.expand();
  webApp?.onEvent?.("viewportChanged", handleChange);
  window.visualViewport?.addEventListener("resize", handleChange);
  window.visualViewport?.addEventListener("scroll", handleChange);
  window.addEventListener("resize", handleChange);

  emitSnapshot();

  return () => {
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
    }
    webApp?.offEvent?.("viewportChanged", handleChange);
    window.visualViewport?.removeEventListener("resize", handleChange);
    window.visualViewport?.removeEventListener("scroll", handleChange);
    window.removeEventListener("resize", handleChange);
  };
}

export function openTelegramUrl(url: string): void {
  const app = getTelegramWebApp();
  if (app?.openTelegramLink) {
    app.openTelegramLink(url);
    return;
  }
  if (app?.openLink) {
    app.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
