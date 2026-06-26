import { useState } from "react";
import { t } from "../i18n";
import type { ApplicationFilter, DinnerRecord, Language, MiniAppApplication } from "../types";
import {
  formatApplicationPackageSummary,
  formatDateWithTime,
  isPastDate,
  parseApplicationSummary,
  statusLabel,
  statusTone,
} from "./formatters";
import { StatusBadge } from "./Primitives";

const PAGE_SIZE = 5;

type AppFilter = "all" | "pending" | "confirmed" | "cancelled";

function AppPlaceholder() {
  return (
    <div className="ap-img-placeholder">
      <svg viewBox="0 0 64 80" fill="none" className="ap-img-placeholder__logo">
        <path d="M32 4 C18 4 8 16 8 28 C8 44 20 56 32 68 C44 56 56 44 56 28 C56 16 46 4 32 4 Z" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="32" y="36" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="700" fontFamily="serif" fill="currentColor" letterSpacing="-1">SD</text>
      </svg>
      <span className="ap-img-placeholder__label">SECRET DINNER</span>
    </div>
  );
}

function statusMessage(language: Language, status: string): { text: string; tone: "gold" | "green" | "red" | "muted" } {
  switch (status) {
    case "pending_application":
    case "contacted":
      return { text: t(language, "appMsgPending"), tone: "gold" };
    case "waiting_payment":
      return { text: t(language, "appMsgWaitingPayment"), tone: "gold" };
    case "approved":
    case "paid":
      return { text: t(language, "appMsgConfirmed"), tone: "green" };
    case "cancelled":
    case "rejected":
      return { text: t(language, "appMsgCancelled"), tone: "red" };
    case "no_show":
      return { text: t(language, "appMsgNoShow"), tone: "red" };
    default:
      return { text: t(language, "appMsgPending"), tone: "muted" };
  }
}

function appFilterMatches(item: MiniAppApplication, filter: AppFilter): boolean {
  if (filter === "all") return true;
  if (filter === "pending") {
    return (
      (item.status === "pending_application" ||
        item.status === "contacted" ||
        item.status === "waiting_payment") &&
      !isPastDate(item.dinnerDate)
    );
  }
  if (filter === "confirmed") return item.status === "approved" || item.status === "paid";
  if (filter === "cancelled") return item.status === "cancelled" || item.status === "rejected" || item.status === "no_show";
  return true;
}

function ApplicationCard({
  item,
  language,
  location,
}: {
  item: MiniAppApplication;
  language: Language;
  location: string;
}) {
  const summary = parseApplicationSummary(item.menu);
  const packageSummary = formatApplicationPackageSummary(language, summary);
  const msg = statusMessage(language, item.status);
  const tone = statusTone(item.status);
  const locationText = location.trim() ? location : t(language, "locationRevealedAfterConfirmation");

  return (
    <div className="ap-card">
      <div className="ap-card__img-col">
        <AppPlaceholder />
        <div className="ap-card__guests-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{item.guestCount}×</span>
        </div>
      </div>

      <div className="ap-card__info-col">
        <div className="ap-card__toprow">
          <div className="ap-card__date">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatDateWithTime(item.dinnerDate)}</span>
          </div>
          <StatusBadge label={statusLabel(language, item.status)} tone={tone} />
        </div>

        <h3 className="ap-card__title">{item.dinnerName}</h3>

        <div className="ap-card__location">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{locationText}</span>
        </div>

        <div className="ap-card__pills">
          <span className="ap-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
            {packageSummary}
          </span>
          <span className="ap-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {item.tablePreference === "private" ? t(language, "privateTable") : t(language, "sharedTable")}
          </span>
        </div>

        <div className={`ap-card__msg ap-card__msg--${msg.tone}`}>
          {msg.tone === "gold" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {msg.tone === "green" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {msg.tone === "red" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span>{msg.text}</span>
        </div>

        <div className="ap-card__arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function StatsRow({ applications, language }: { applications: MiniAppApplication[]; language: Language }) {
  const total = applications.length;
  const pending = applications.filter(a =>
    (a.status === "pending_application" || a.status === "contacted" || a.status === "waiting_payment") && !isPastDate(a.dinnerDate)
  ).length;
  const confirmed = applications.filter(a => a.status === "approved" || a.status === "paid").length;
  const cancelled = applications.filter(a => a.status === "cancelled" || a.status === "rejected" || a.status === "no_show").length;

  return (
    <div className="ap-stats-row">
      <div className="ap-stat">
        <div className="ap-stat__icon ap-stat__icon--gold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div className="ap-stat__text">
          <strong>{total}</strong>
          <span>{t(language, "total")}</span>
        </div>
      </div>
      <div className="ap-stat">
        <div className="ap-stat__icon ap-stat__icon--amber">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="ap-stat__text">
          <strong>{pending}</strong>
          <span>{t(language, "pending")}</span>
        </div>
      </div>
      <div className="ap-stat">
        <div className="ap-stat__icon ap-stat__icon--green">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="ap-stat__text">
          <strong>{confirmed}</strong>
          <span>{t(language, "confirmed")}</span>
        </div>
      </div>
      <div className="ap-stat">
        <div className="ap-stat__icon ap-stat__icon--red">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div className="ap-stat__text">
          <strong>{cancelled}</strong>
          <span>{t(language, "cancelled")}</span>
        </div>
      </div>
    </div>
  );
}

export function ApplicationsScreen({
  language,
  applications,
  dinners,
  filter,
  onFilterChange,
  onExploreDinners,
}: {
  language: Language;
  applications: MiniAppApplication[];
  dinners: DinnerRecord[];
  filter: ApplicationFilter;
  onFilterChange: (value: ApplicationFilter) => void;
  onExploreDinners: () => void;
}) {
  const [page, setPage] = useState(1);

  const appFilter: AppFilter =
    filter === "upcoming" ? "pending" :
    filter === "past" ? "confirmed" :
    filter === "cancelled" ? "cancelled" : "all";

  const FILTERS: Array<{ key: AppFilter; label: string }> = [
    { key: "all", label: t(language, "all") },
    { key: "pending", label: t(language, "pending") },
    { key: "confirmed", label: t(language, "confirmed") },
    { key: "cancelled", label: t(language, "cancelled") },
  ];

  const dinnerLocationMap = new Map<number, string>(
    dinners.map(d => [d.id, d.location ?? ""])
  );

  const filtered = applications.filter(a => appFilterMatches(a, appFilter));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleFilterChange(f: AppFilter) {
    const mapped: ApplicationFilter =
      f === "pending" ? "upcoming" :
      f === "confirmed" ? "past" :
      f === "cancelled" ? "cancelled" : "all";
    onFilterChange(mapped);
    setPage(1);
  }

  return (
    <div className="ap-screen">
      {/* Header */}
      <div className="ap-header">
        <div className="ap-header__top">
          <div>
            <h1 className="ap-header__title">
              {t(language, "myApplications")}
              <span className="ap-header__sparkle"> ✦✦</span>
            </h1>
            <p className="ap-header__sub">{t(language, "applicationsSubtitle")}</p>
          </div>
          <div className="ap-filter-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <line x1="12" y1="18" x2="20" y2="18" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ap-filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`ap-filter-tab${appFilter === f.key ? " ap-filter-tab--active" : ""}`}
            onClick={() => handleFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats 2×2 */}
      <StatsRow applications={applications} language={language} />

      {/* Section label */}
      <div className="ap-section-header">
        <span className="ap-section-header__title">{t(language, "upcomingApplications")}</span>
        <button className="ap-section-header__link" onClick={() => handleFilterChange("all")}>
          {t(language, "viewPast")} →
        </button>
      </div>

      {/* List / empty */}
      {applications.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty__emblem">✦</div>
          <h3 className="ap-empty__title">{t(language, "noApplicationsYet")}</h3>
          <p className="ap-empty__sub">{t(language, "noApplicationsSub")}</p>
          <button className="ap-empty__cta" onClick={onExploreDinners}>
            {t(language, "exploreDinners")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty ap-empty--filter">
          <p className="ap-empty__sub">{t(language, "noApplicationsInFilter")}</p>
        </div>
      ) : (
        <>
          <div className="ap-list">
            {pageItems.map(item => (
              <ApplicationCard
                key={item.packageInfoId}
                item={item}
                language={language}
                location={dinnerLocationMap.get(item.dinnerId) ?? ""}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="ap-pagination">
              <button
                className="ap-pagination__btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                {t(language, "previous")}
              </button>
              <span className="ap-pagination__label">{safePage} / {totalPages}</span>
              <button
                className="ap-pagination__btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                {t(language, "next")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
