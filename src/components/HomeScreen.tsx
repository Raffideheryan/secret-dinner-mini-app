import { t } from "../i18n";
import type { BootstrapResponse, Language, MiniAppApplication, NextDinner } from "../types";
import {
  buildProfileName,
  countSeatsLeft,
  formatShortDate,
  getInitial,
  getPointsRemaining,
  toProgressPercent,
} from "./formatters";
import { StatusBadge } from "./Primitives";

export function HomeScreen({
  bootstrap,
  language,
  nextDinner,
  applications,
  copied,
  onReserve,
  onCopy,
  onShare,
}: {
  bootstrap: BootstrapResponse;
  language: Language;
  nextDinner: NextDinner | null;
  applications: MiniAppApplication[];
  copied: boolean;
  onReserve: () => void;
  onCopy: () => void;
  onShare: () => void;
}) {
  const displayName = buildProfileName(
    bootstrap.user.name,
    bootstrap.user.surname,
    bootstrap.user.username,
  );
  const pointsRemaining = getPointsRemaining(bootstrap.user.points, bootstrap.loyaltyGoal);
  const dinnerBadge = applications.find((item) => item.dinnerId === nextDinner?.id);

  return (
    <div className="screen-stack">

      {/* ── Hero header ── */}
      <section className="home-hero">
        <div className="home-hero__topbar">
          <span className="home-hero__brand">SECRET DINNER ✦✦</span>
        </div>
        <div className="home-hero__body">
          <div className="home-hero__greeting">
            <p className="home-hero__eyebrow">{t(language, "goodEvening")}</p>
            <h1 className="home-hero__name">{displayName} <span className="home-hero__wave">👋</span></h1>
          </div>
          <div className="home-avatar">
            {getInitial(bootstrap.user.name, bootstrap.user.surname, bootstrap.user.username)}
          </div>
        </div>
      </section>

      {/* ── Points card ── */}
      <section className="card home-points-card">
        <div className="home-points-card__inner">
          <div className="home-points-card__star-col">
            <div className="home-points-star">
              <span>⭐</span>
            </div>
          </div>
          <div className="home-points-card__metrics">
            <div className="home-points-metric">
              <span className="home-points-metric__label">{t(language, "points")}</span>
              <strong className="home-points-metric__value">{bootstrap.user.points}</strong>
            </div>
            <div className="home-points-divider" />
            <div className="home-points-metric home-points-metric--right">
              <span className="home-points-metric__label">{t(language, "nextDiscount")}</span>
              <strong className="home-points-metric__value">{pointsRemaining}</strong>
              <small className="home-points-metric__helper">{t(language, "ptsAway")}</small>
            </div>
          </div>
        </div>
        <div className="home-progress-bar">
          <div
            className="home-progress-bar__fill"
            style={{ width: `${toProgressPercent(bootstrap.user.points, bootstrap.loyaltyGoal)}%` }}
          />
        </div>
        <div className="home-points-footer">
          <span>{bootstrap.user.points} / {bootstrap.loyaltyGoal}</span>
        </div>
      </section>

      {/* ── Referral card ── */}
      <section className="card home-referral-card">
        <div className="home-referral-card__left">
          <div className="home-referral-card__sparkles" aria-hidden="true">✦</div>
          <h3 className="home-referral-card__title">{t(language, "inviteEarn")}</h3>
          <p className="home-referral-card__sub">{t(language, "inviteNote")}</p>
          <div className="home-referral-code-row">
            <div className="home-referral-code">
              <span>{bootstrap.user.referralCode || "—"}</span>
              <button
                className="home-referral-copy-btn"
                onClick={onCopy}
                aria-label={t(language, "copy")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="home-referral-card__gift" aria-hidden="true">🎁</div>
      </section>

      {/* ── Next Dinner card ── */}
      <section className="card home-dinner-card">
        <div className="home-dinner-card__header">
          <h2 className="home-dinner-card__heading">{t(language, "nextDinner")}</h2>
          <button className="home-text-link" onClick={onReserve}>{t(language, "viewAll")}</button>
        </div>

        {nextDinner ? (
          <>
            <div className="home-dinner-card__meta">
              <div className="home-dinner-card__date">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{formatShortDate(nextDinner.dinnerDate)}</span>
              </div>
              {dinnerBadge ? (
                <StatusBadge
                  label={
                    dinnerBadge.status === "approved" || dinnerBadge.status === "paid"
                      ? t(language, "confirmed")
                      : t(language, "pending")
                  }
                  tone={
                    dinnerBadge.status === "approved" || dinnerBadge.status === "paid"
                      ? "green"
                      : "slate"
                  }
                />
              ) : (
                <StatusBadge label={t(language, "pending")} tone="slate" />
              )}
            </div>

            <h3 className="home-dinner-card__title">{nextDinner.description}</h3>

            <div className="home-dinner-card__location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{t(language, "secretLocation")}</span>
            </div>

            <div className="home-dinner-card__pills">
              <span className="home-pill home-pill--green">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {nextDinner.alreadyRegistered} {t(language, "registered")}
              </span>
              <span className="home-pill home-pill--default">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 9V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2" />
                  <rect x="2" y="9" width="20" height="13" rx="2" />
                  <path d="M12 9v13" />
                </svg>
                {countSeatsLeft(nextDinner)} {t(language, "seatsLeft")}
              </span>
            </div>

            <button className="home-reserve-btn" onClick={onReserve}>
              {t(language, "reserveSeat")}
              <span className="home-reserve-btn__arrow">→</span>
            </button>
          </>
        ) : (
          <p className="empty-copy">{t(language, "noUpcomingDinner")}</p>
        )}
      </section>
    </div>
  );
}
