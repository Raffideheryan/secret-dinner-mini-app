/// <reference types="vite/client" />

interface TelegramWebAppUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  themeParams: TelegramThemeParams;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  viewportHeight?: number;
  stableHeight?: number;
  ready(): void;
  expand(): void;
  requestFullscreen?(): void;
  onEvent?(eventType: string, eventHandler: () => void): void;
  offEvent?(eventType: string, eventHandler: () => void): void;
  openTelegramLink(url: string): void;
  openLink(url: string): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
