import React from "react";
import { t } from "../i18n";
import type { Language, TabKey } from "../types";

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.1875L21.4501 10.275L21.0001 11.625H20.25V20.25H3.75005V11.625H3.00005L2.55005 10.275L12 3.1875ZM5.25005 10.125V18.75H18.75V10.125L12 5.0625L5.25005 10.125Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconDinner() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17 4L17 2L19 2C19.553 2 20 1.553 20 1C20 0.448 19.553 0 19 0L13 0C12.447 0 12 0.448 12 1C12 1.553 12.447 2 13 2L15 2L15 4C6.632 4.519 0 11.501 0 20L0 21C0 21.553 0.447 22 1 22L31 22C31.553 22 32 21.553 32 21L32 20C32 11.501 25.368 4.519 17 4Z"
        fill="currentColor"
      />
      <path
        d="M31 24L1 24C0.447 24 0 24.448 0 25C0 25.553 0.447 26 1 26L31 26C31.553 26 32 25.553 32 25C32 24.448 31.553 24 31 24Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconApplications() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 18.5V7C20 6.448 19.552 6 19 6H5C4.448 6 4 6.448 4 7V21C4 21.553 4.448 22 5 22H15.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 18.5L20 15C20 14.448 19.552 14 19 14H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="8" x2="15" y1="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" x2="13" y1="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="11.5" x2="20" y1="22" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.72 11.28 8.72 9.51C8.72 7.7 10.18 6.23 12 6.23C13.81 6.23 15.28 7.7 15.28 9.51C15.27 11.28 13.88 12.72 12.12 12.78Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.74 19.38C16.96 21.01 14.6 22 12 22C9.4 22 7.04 21.01 5.26 19.38C5.36 18.44 5.96 17.52 7.03 16.8C9.77 14.98 14.25 14.98 16.97 16.8C18.04 17.52 18.64 18.44 18.74 19.38Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS: Record<TabKey, () => React.ReactElement> = {
  home: IconHome,
  dinners: IconDinner,
  applications: IconApplications,
  profile: IconProfile,
};

const ITEMS: TabKey[] = ["home", "dinners", "applications", "profile"];

export function BottomNav({
  activeTab,
  language,
  onChange,
  hidden = false,
}: {
  activeTab: TabKey;
  language: Language;
  onChange: (tab: TabKey) => void;
  hidden?: boolean;
}) {
  return (
    <nav
      className={hidden ? "bottom-nav bottom-nav--hidden" : "bottom-nav"}
      aria-hidden={hidden}
    >
      {ITEMS.map((key) => {
        const Icon = ICONS[key];
        return (
          <button
            key={key}
            className={key === activeTab ? "bottom-nav__item is-active" : "bottom-nav__item"}
            onClick={() => onChange(key)}
          >
            <span className="bottom-nav__icon">
              <Icon />
            </span>
            <span>{t(language, key)}</span>
          </button>
        );
      })}
    </nav>
  );
}
