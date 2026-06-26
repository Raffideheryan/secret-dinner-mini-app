import { useState } from "react";
import { t } from "../i18n";
import type { DinnerRecord, Language, MiniAppApplication, NextDinner } from "../types";
import {
  countDinnerSeatsLeft,
  countSeatsLeft,
  dinnerBadge,
  formatDateWithTime,
  formatMoney,
  formatShortDate,
  getDinnerFilterStatus,
  mapDinnerRecordToNextDinner,
} from "./formatters";
import { SectionTitle, StatusBadge } from "./Primitives";

type DinnerFilter = "all" | "upcoming" | "past" | "cancelled";

/* ── Placeholder image when no photo is available ── */
function DinnerPlaceholder() {
  return (
    <div className="dc-img-placeholder">
      <div className="dc-img-placeholder__inner">
        <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="dc-img-placeholder__logo">
          <path
            d="M32 4 C18 4 8 16 8 28 C8 44 20 56 32 68 C44 56 56 44 56 28 C56 16 46 4 32 4 Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <text
            x="32"
            y="36"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fontWeight="700"
            fontFamily="serif"
            fill="currentColor"
            letterSpacing="-1"
          >
            SD
          </text>
        </svg>
        <span className="dc-img-placeholder__label">SECRET DINNER</span>
      </div>
    </div>
  );
}

function seatsLeftBadge(dinner: DinnerRecord): { label: string; tone: "green" | "red" | "slate" } {
  const left = countDinnerSeatsLeft(dinner);
  if (left <= 0) {
    return { label: "Sold out", tone: "red" };
  }
  if (left <= 3) {
    return { label: `${left} left`, tone: "slate" };
  }
  return { label: `${left} spots left`, tone: "slate" };
}

/* ── Single dinner card ── */
function DinnerCard({
  dinner,
  language,
  onReserve,
}: {
  dinner: DinnerRecord;
  language: Language;
  onReserve: () => void;
}) {
  const seatsLeft = countDinnerSeatsLeft(dinner);
  const normalized = mapDinnerRecordToNextDinner(dinner);
  const filterStatus = getDinnerFilterStatus(dinner);
  const isSoldOut = seatsLeft <= 0;
  const isPast = filterStatus === "past";
  const canReserve = !isPast && !isSoldOut;

  const { label: imageBadgeLabel, tone: imageBadgeTone } = seatsLeftBadge(dinner);

  const privateBookings = dinner.activeBookings ?? 0;
  const sharedBookings = Math.max(0, normalized.alreadyRegistered - privateBookings);
  const hasPrivate = privateBookings > 0;

  return (
    <div className="dc-card">
      {/* Left: image column */}
      <div className="dc-card__img-col">
        <DinnerPlaceholder />
        <div className={`dc-card__img-badge dc-card__img-badge--${imageBadgeTone}`}>
          {imageBadgeTone === "green" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {imageBadgeTone === "red" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {imageBadgeTone === "slate" && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )}
          <span>{imageBadgeLabel}</span>
        </div>
      </div>

      {/* Right: info column */}
      <div className="dc-card__info-col">
        {/* Date + sold-out/past status indicator */}
        <div className="dc-card__meta">
          <div className="dc-card__date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatDateWithTime(dinner.dinnerDate)}</span>
          </div>
          {isPast && <StatusBadge label={t(language, "past")} tone="slate" />}
          {isSoldOut && !isPast && <StatusBadge label={t(language, "soldOut")} tone="red" />}
        </div>

        {/* Title */}
        <h3 className="dc-card__title">{dinner.description}</h3>

        {/* Location */}
        <div className="dc-card__location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{t(language, "secretLocation")}</span>
        </div>

        {/* Stats row: registered / seats left / table */}
        <div className="dc-card__stats">
          <div className="dc-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <strong>{normalized.alreadyRegistered}</strong>
            <span>{t(language, "registered")}</span>
          </div>
          <div className="dc-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 9V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2" />
              <rect x="2" y="9" width="20" height="13" rx="2" />
              <path d="M12 9v13" />
            </svg>
            <strong>{seatsLeft}</strong>
            <span>{t(language, "seatsLeft")}</span>
          </div>
          <div className="dc-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <strong>{hasPrivate ? privateBookings : sharedBookings}</strong>
            <span>{hasPrivate ? t(language, "separateTables") : t(language, "sharedTableLabel")}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="dc-card__action">
          <button
            className={`dc-reserve-btn${!canReserve ? " dc-reserve-btn--disabled" : ""}`}
            onClick={canReserve ? onReserve : undefined}
            disabled={!canReserve}
          >
            {isPast
              ? t(language, "past")
              : isSoldOut
                ? t(language, "soldOut")
                : t(language, "reserveSeat")}
            {canReserve && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main DinnersScreen ── */
export function DinnersScreen({
  dinners,
  applications,
  language,
  onReserve,
}: {
  dinners: DinnerRecord[];
  applications: MiniAppApplication[];
  language: Language;
  onReserve: (dinnerId: number) => void;
}) {
  const [filter, setFilter] = useState<DinnerFilter>("all");

  const filters: DinnerFilter[] = ["all", "upcoming", "past", "cancelled"];
  const filterLabel: Record<DinnerFilter, string> = {
    all: t(language, "all"),
    upcoming: t(language, "upcoming"),
    past: t(language, "past"),
    cancelled: t(language, "cancelled"),
  };

  const filtered = dinners.filter((d) => {
    if (filter === "all") return true;
    if (filter === "cancelled") {
      const app = applications.find((a) => a.dinnerId === d.id);
      return app?.status === "cancelled" || app?.status === "rejected";
    }
    return getDinnerFilterStatus(d) === filter;
  });

  return (
    <div className="screen-stack">
      {/* ── Page header ── */}
      <div className="dp-header">
        <div className="dp-header__top">
          <h1 className="dp-header__title">
            {t(language, "dinners")}
            <span className="dp-header__sparkle"> ✦✦</span>
          </h1>
          <button className="dp-filter-icon" aria-label="Filter" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
        <p className="dp-header__sub">{t(language, "discoverDinners")}</p>
      </div>

      {/* ── Filter tabs ── */}
      <div className="dp-filter-bar">
        {filters.map((f) => (
          <button
            key={f}
            className={`dp-filter-tab${filter === f ? " dp-filter-tab--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {/* ── Dinner list ── */}
      <div className="dp-list">
        {filtered.length === 0 ? (
          <div className="dp-empty">
            <p>{t(language, "noDinnersFound")}</p>
          </div>
        ) : (
          filtered.map((dinner) => (
            <DinnerCard
              key={dinner.id}
              dinner={dinner}
              language={language}
              onReserve={() => onReserve(dinner.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ── DinnerDetailCard (used by App.tsx, keep unchanged API) ── */
export function DinnerDetailCard({
  dinner,
  language,
  onReserve,
}: {
  dinner: NextDinner;
  language: Language;
  onReserve: () => void;
}) {
  return (
    <section className="card dinner-detail">
      <div className="dinner-card__meta">
        <span>{formatShortDate(dinner.dinnerDate)}</span>
        <StatusBadge
          label={countSeatsLeft(dinner) > 0 ? t(language, "open") : t(language, "soldOut")}
          tone={countSeatsLeft(dinner) > 0 ? "slate" : "red"}
        />
      </div>
      <h3 className="dinner-card__title">{dinner.description}</h3>
      <p className="dinner-card__location">{t(language, "secretLocation")}</p>
      <div className="dinner-stats">
        <div className="stat-tile">
          <span>{t(language, "registered")}</span>
          <strong>{dinner.alreadyRegistered}</strong>
        </div>
        <div className="stat-tile stat-tile--success">
          <span>{t(language, "seatsLeft")}</span>
          <strong>{countSeatsLeft(dinner)}</strong>
        </div>
        <div className="stat-tile">
          <span>{t(language, "table")}</span>
          <strong>{t(language, "sharedTable")}</strong>
        </div>
      </div>
      <details className="disclosure-card disclosure-card--section">
        <summary>{t(language, "packagePrices")}</summary>
        <SectionTitle title={t(language, "packagePrices")} />
        <div className="package-price-list">
          {dinner.silverPrice > 0 ? <PackagePriceRow language={language} title={t(language, "packageSilver")} price={dinner.silverPrice} remaining={dinner.availability.silverRemaining} tone="silver" /> : null}
          {dinner.goldPrice > 0 ? <PackagePriceRow language={language} title={t(language, "packageGold")} price={dinner.goldPrice} remaining={dinner.availability.goldRemaining} tone="gold" /> : null}
          {dinner.vipPrice > 0 ? <PackagePriceRow language={language} title={t(language, "packageVip")} price={dinner.vipPrice} remaining={dinner.availability.vipRemaining} tone="vip" /> : null}
        </div>
      </details>
      <button className="primary-button full-width" onClick={onReserve} disabled={countSeatsLeft(dinner) <= 0}>
        {countSeatsLeft(dinner) > 0 ? t(language, "reserveSeat") : t(language, "soldOut")}
      </button>
    </section>
  );
}

function PackagePriceRow({
  language,
  title,
  price,
  remaining,
  tone,
}: {
  language: Language;
  title: string;
  price: number;
  remaining: number;
  tone: "silver" | "gold" | "vip";
}) {
  return (
    <div className={`package-price-row package-price-row--${tone}`}>
      <div className="package-price-row__content">
        <strong>{title}</strong>
        <span>{formatMoney(price)}</span>
      </div>
      <small>{remaining} {t(language, "seatsLeft")}</small>
    </div>
  );
}
