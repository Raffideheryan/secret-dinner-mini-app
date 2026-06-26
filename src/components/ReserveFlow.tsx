import { useEffect } from "react";
import { t } from "../i18n";
import type {
  Language,
  NextDinner,
  PackageType,
  ReservationDraft,
  ReserveStep,
  TablePreference,
} from "../types";
import { countSeatsLeft, formatDateWithTime, formatMoney, packageLabel } from "./formatters";
import { ScreenMessage, StatusBadge } from "./Primitives";

export function ReserveFlow({
  dinner,
  language,
  step,
  draft,
  availablePackages,
  submitting,
  submitted,
  onStepChange,
  onGuestCountChange,
  onPackageChange,
  onTableChange,
  onFieldChange,
  onSubmit,
  onViewApplications,
  onBackHome,
  onBackToDinners,
}: {
  dinner: NextDinner | null;
  language: Language;
  step: ReserveStep;
  draft: ReservationDraft;
  availablePackages: PackageType[];
  submitting: boolean;
  submitted: boolean;
  onStepChange: (step: ReserveStep) => void;
  onGuestCountChange: (count: number) => void;
  onPackageChange: (index: number, pkg: PackageType) => void;
  onTableChange: (value: TablePreference) => void;
  onFieldChange: (patch: Partial<ReservationDraft>) => void;
  onSubmit: () => void;
  onViewApplications: () => void;
  onBackHome: () => void;
  onBackToDinners?: () => void;
}) {
  if (submitted && dinner) {
    return (
      <ScreenMessage
        title={t(language, "applicationSubmitted")}
        body={t(language, "notifiedReviewed")}
        action={
          <div className="screen-state__actions">
            <div className="rf-success-card">
              <div className="rf-success-card__header">
                <span className="rf-success-icon">✦</span>
                <div>
                  <p className="rf-success-card__name">{dinner.description}</p>
                  <StatusBadge label={t(language, "pending")} tone="slate" />
                </div>
              </div>
              <div className="rf-success-grid">
                <InfoTile label={t(language, "guests")} value={draft.guestCount.toString()} />
                <InfoTile label={t(language, "packageSummary")} value={buildPackageSummary(language, draft.guestPackages)} />
                <InfoTile label={t(language, "table")} value={draft.tablePreference === "private" ? t(language, "privateTable") : t(language, "sharedTable")} />
              </div>
            </div>
            <button className="primary-button full-width" onClick={onViewApplications}>
              {t(language, "viewApplications")}
            </button>
            <button className="secondary-button full-width" onClick={onBackHome}>
              {t(language, "backHome")}
            </button>
          </div>
        }
      />
    );
  }

  if (!dinner) {
    return (
      <div className="rf-empty">
        <p>{t(language, "chooseDinner")}</p>
      </div>
    );
  }

  if (countSeatsLeft(dinner) <= 0) {
    return (
      <div className="rf-empty">
        <p>{t(language, "soldOutState")}</p>
      </div>
    );
  }

  if (availablePackages.length === 0) {
    return (
      <div className="rf-empty">
        <p>{t(language, "noPackagesOffered")}</p>
      </div>
    );
  }

  const totalPrice = draft.guestPackages.reduce(
    (sum, pkg) => sum + packagePrice(dinner, pkg),
    0,
  );

  return (
    <div className="rf-shell">
      {/* Dinner context card — back button + dinner info + package prices */}
      <div className="rf-dinner-context">
        {/* Top row: back button + eyebrow */}
        <div className="rf-dinner-context__toprow">
          {onBackToDinners ? (
            <button className="rf-dinner-context__back" onClick={onBackToDinners}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {t(language, "dinners")}
            </button>
          ) : null}
          <span className="rf-dinner-context__eyebrow">{t(language, "reserveFlowTitle")}</span>
        </div>

        {/* Dinner title + date/seats */}
        <div className="rf-dinner-context__body">
          <strong className="rf-dinner-context__title">{dinner.description}</strong>
          <div className="rf-dinner-context__meta">
            <span className="rf-dinner-context__date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDateWithTime(dinner.dinnerDate)}
            </span>
            <span className="rf-dinner-context__seats">
              {countSeatsLeft(dinner)} {t(language, "seatsLeft")}
            </span>
          </div>
        </div>

        {/* Package price pills */}
        {(dinner.silverPrice > 0 || dinner.goldPrice > 0 || dinner.vipPrice > 0) && (
          <div className="rf-dinner-context__prices">
            {dinner.silverPrice > 0 && (
              <div className="rf-price-pill rf-price-pill--silver">
                <span className="rf-price-pill__name">{t(language, "packageSilver")}</span>
                <strong className="rf-price-pill__price">{formatMoney(dinner.silverPrice)}</strong>
                <PillSeats remaining={dinner.availability.silverRemaining} selected={draft.guestPackages.filter(p => p === "silver").length} language={language} />
              </div>
            )}
            {dinner.goldPrice > 0 && (
              <div className="rf-price-pill rf-price-pill--gold">
                <span className="rf-price-pill__name">{t(language, "packageGold")}</span>
                <strong className="rf-price-pill__price">{formatMoney(dinner.goldPrice)}</strong>
                <PillSeats remaining={dinner.availability.goldRemaining} selected={draft.guestPackages.filter(p => p === "gold").length} language={language} />
              </div>
            )}
            {dinner.vipPrice > 0 && (
              <div className="rf-price-pill rf-price-pill--vip">
                <span className="rf-price-pill__name">{t(language, "packageVip")}</span>
                <strong className="rf-price-pill__price">{formatMoney(dinner.vipPrice)}</strong>
                <PillSeats remaining={dinner.availability.vipRemaining} selected={draft.guestPackages.filter(p => p === "vip").length} language={language} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step indicator */}
      <RfStepIndicator language={language} step={step} />

      {/* Step label — current step title shown below stepper */}
      <div className="rf-step-label">
        <h2 className="rf-step-label__title">{stepTitle(language, step)}</h2>
      </div>

      {/* Step content */}
      <div className="rf-content">
        {step === 1 ? (
          <Step1Guests
            language={language}
            dinner={dinner}
            draft={draft}
            onGuestCountChange={onGuestCountChange}
            onStepChange={onStepChange}
          />
        ) : null}

        {step === 2 ? (
          <Step2Packages
            language={language}
            dinner={dinner}
            draft={draft}
            availablePackages={availablePackages}
            totalPrice={totalPrice}
            onPackageChange={onPackageChange}
            onTableChange={onTableChange}
            onStepChange={onStepChange}
          />
        ) : null}

        {step === 3 ? (
          <Step3Details
            language={language}
            draft={draft}
            submitting={submitting}
            onFieldChange={onFieldChange}
            onStepChange={onStepChange}
            onSubmit={onSubmit}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ── Step titles ── */
function stepTitle(language: Language, step: ReserveStep): string {
  switch (step) {
    case 1: return t(language, "howManyGuests");
    case 2: return t(language, "choosePackageEachGuest");
    case 3: return t(language, "contactDetails");
  }
}

/* ── Premium step indicator ── */
function RfStepIndicator({ language, step }: { language: Language; step: ReserveStep }) {
  const items: Array<{ step: ReserveStep; label: string }> = [
    { step: 1, label: t(language, "guests") },
    { step: 2, label: t(language, "packages") },
    { step: 3, label: t(language, "details") },
  ];

  return (
    <div className="rf-stepper">
      {items.map((item, idx) => {
        const isActive = item.step === step;
        const isDone = item.step < step;
        const stateClass = isActive ? "rf-stepper__item--active" : isDone ? "rf-stepper__item--done" : "rf-stepper__item--future";
        return (
          <div key={item.step} className="rf-stepper__item-wrap">
            {idx > 0 && (
              <div className={`rf-stepper__line${isDone || isActive ? " rf-stepper__line--lit" : ""}`} />
            )}
            <div className={`rf-stepper__item ${stateClass}`}>
              <div className="rf-stepper__circle">
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{item.step}</span>
                )}
              </div>
              <span className="rf-stepper__label">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1: Guests ── */
function Step1Guests({
  language,
  dinner,
  draft,
  onGuestCountChange,
  onStepChange,
}: {
  language: Language;
  dinner: NextDinner;
  draft: ReservationDraft;
  onGuestCountChange: (count: number) => void;
  onStepChange: (step: ReserveStep) => void;
}) {
  const seatsLeft = countSeatsLeft(dinner);
  const canIncrease = draft.guestCount < seatsLeft;
  const canDecrease = draft.guestCount > 1;

  return (
    <>
      {/* Guest counter */}
      <div className="rf-guest-counter">
        <button
          className="rf-counter-btn"
          onClick={() => canDecrease && onGuestCountChange(draft.guestCount - 1)}
          disabled={!canDecrease}
          aria-label="Decrease guest count"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div className="rf-guest-value">
          <strong className="rf-guest-value__num">{draft.guestCount}</strong>
          <span className="rf-guest-value__label">{draft.guestCount === 1 ? "Guest" : "Guests"}</span>
        </div>
        <button
          className="rf-counter-btn"
          onClick={() => canIncrease && onGuestCountChange(draft.guestCount + 1)}
          disabled={!canIncrease}
          aria-label="Increase guest count"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Seats available hint */}
      <div className="rf-seats-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 9V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2" />
          <rect x="2" y="9" width="20" height="13" rx="2" />
          <path d="M12 9v13" />
        </svg>
        <span>{seatsLeft} {t(language, "seatsLeft")}</span>
      </div>

      {/* Info card */}
      <div className="rf-info-card">
        <div className="rf-info-card__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="rf-info-card__text">{t(language, "guestHelper")}</p>
      </div>

      {/* Sticky CTA */}
      <div className="rf-sticky-cta">
        <button className="rf-cta-btn" onClick={() => onStepChange(2)}>
          {t(language, "continue")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </>
  );
}

/* ── Step 2: Packages ── */
function Step2Packages({
  language,
  dinner,
  draft,
  availablePackages,
  totalPrice,
  onPackageChange,
  onTableChange,
  onStepChange,
}: {
  language: Language;
  dinner: NextDinner;
  draft: ReservationDraft;
  availablePackages: PackageType[];
  totalPrice: number;
  onPackageChange: (index: number, pkg: PackageType) => void;
  onTableChange: (value: TablePreference) => void;
  onStepChange: (step: ReserveStep) => void;
}) {
  const packageLimits = getPackageSeatLimits(dinner);
  const packageOptionsByGuest = Array.from({ length: draft.guestCount }, (_, index) =>
    getSelectablePackagesForGuest({
      index,
      guestPackages: draft.guestPackages,
      availablePackages,
      packageLimits,
    }),
  );

  useEffect(() => {
    packageOptionsByGuest.forEach((options, index) => {
      const currentPackage = draft.guestPackages[index];
      const fallbackPackage = options[0];
      if (!fallbackPackage) {
        return;
      }
      if (!currentPackage || !options.includes(currentPackage)) {
        onPackageChange(index, fallbackPackage);
      }
    });
  }, [draft.guestPackages, onPackageChange, packageOptionsByGuest]);

  return (
    <>
      {/* Package selectors */}
      <div className="rf-form-stack">
        {Array.from({ length: draft.guestCount }, (_, index) => (
          <label key={`pkg-${index + 1}`} className="rf-field">
            <span className="rf-field__label">{t(language, "packageForGuest")} {index + 1}</span>
            <select
              className="rf-field__select"
              value={draft.guestPackages[index] ?? packageOptionsByGuest[index][0]}
              onChange={(e) => onPackageChange(index, e.target.value as PackageType)}
            >
              {packageOptionsByGuest[index].map((pkg) => (
                <option key={pkg} value={pkg}>
                  {packageLabel(language, pkg)}
                  {pkgPriceLabel(dinner, pkg)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {/* Table preference */}
      <div className="rf-section-label">{t(language, "table")}</div>
      <div className="rf-table-choice">
        <button
          className={`rf-table-btn${draft.tablePreference === "shared" ? " rf-table-btn--active" : ""}`}
          onClick={() => onTableChange("shared")}
        >
          <span className="rf-table-btn__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <strong>{t(language, "sharedTable")}</strong>
          <small>Meet new people</small>
        </button>
        <button
          className={`rf-table-btn${draft.tablePreference === "private" ? " rf-table-btn--active" : ""}`}
          onClick={() => onTableChange("private")}
        >
          <span className="rf-table-btn__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <strong>{t(language, "privateTable")}</strong>
          <small>More privacy</small>
        </button>
      </div>

      {/* Total price */}
      <div className="rf-total-row">
        <span>{t(language, "totalPrice")}</span>
        <strong>{formatMoney(totalPrice)}</strong>
      </div>

      {/* Sticky CTA */}
      <div className="rf-sticky-cta rf-sticky-cta--two">
        <button className="rf-back-btn-inline" onClick={() => onStepChange(1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t(language, "guests")}
        </button>
        <button className="rf-cta-btn rf-cta-btn--flex" onClick={() => onStepChange(3)}>
          {t(language, "continue")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </>
  );
}

/* ── Step 3: Details ── */
function Step3Details({
  language,
  draft,
  submitting,
  onFieldChange,
  onStepChange,
  onSubmit,
}: {
  language: Language;
  draft: ReservationDraft;
  submitting: boolean;
  onFieldChange: (patch: Partial<ReservationDraft>) => void;
  onStepChange: (step: ReserveStep) => void;
  onSubmit: () => void;
}) {
  const hobbiesValid = draft.hobbies.trim().length >= 10;
  const canSubmit = draft.acceptLegalTerms && hobbiesValid;

  return (
    <>
      <div className="rf-form-stack">
        <label className="rf-field">
          <span className="rf-field__label">{t(language, "phone")}</span>
          <input
            className="rf-field__input"
            value={draft.phone}
            onChange={(e) => onFieldChange({ phone: e.target.value })}
            placeholder="+1 234 567 890"
          />
        </label>
        <label className="rf-field">
          <span className="rf-field__label">
            {t(language, "hobbies")}
            {!hobbiesValid && <span className="rf-field__required"> *</span>}
          </span>
          <textarea
            className={`rf-field__textarea${!hobbiesValid && draft.hobbies.trim().length > 0 ? " rf-field__textarea--warn" : ""}`}
            rows={3}
            value={draft.hobbies}
            onChange={(e) => onFieldChange({ hobbies: e.target.value })}
            placeholder="Tell us about your interests, hobbies, what you enjoy…"
          />
          {!hobbiesValid && (
            <span className="rf-field__hint">
              {draft.hobbies.trim().length === 0
                ? "Required — helps us seat you with compatible guests."
                : `Too short — ${10 - draft.hobbies.trim().length} more character${10 - draft.hobbies.trim().length === 1 ? "" : "s"} needed.`}
            </span>
          )}
        </label>
        <label className="rf-field">
          <span className="rf-field__label">{t(language, "allergies")} <span className="rf-field__optional">({t(language, "optional")})</span></span>
          <textarea
            className="rf-field__textarea"
            rows={3}
            value={draft.allergies}
            onChange={(e) => onFieldChange({ allergies: e.target.value })}
            placeholder="Any dietary restrictions…"
          />
        </label>
      </div>

      {/* Legal consent */}
      <label className="rf-consent">
        <div className={`rf-consent__box${draft.acceptLegalTerms ? " rf-consent__box--checked" : ""}`} onClick={() => onFieldChange({ acceptLegalTerms: !draft.acceptLegalTerms })}>
          {draft.acceptLegalTerms && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span className="rf-consent__text">{t(language, "legalConsent")}</span>
      </label>

      {/* Sticky CTA */}
      <div className="rf-sticky-cta rf-sticky-cta--two">
        <button className="rf-back-btn-inline" onClick={() => onStepChange(2)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t(language, "packages")}
        </button>
        <button
          className={`rf-cta-btn rf-cta-btn--flex${!canSubmit || submitting ? " rf-cta-btn--dim" : ""}`}
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? t(language, "submitting") : t(language, "submitApplication")}
        </button>
      </div>
    </>
  );
}

/* ── Helpers ── */
function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PillSeats({ remaining, selected, language }: { remaining: number; selected: number; language: Language }) {
  const effective = Math.max(0, remaining - selected);
  return (
    <span className={`rf-price-pill__seats${effective === 0 ? " rf-price-pill__seats--zero" : ""}`}>
      {effective} {t(language, "seatsLeft")}
    </span>
  );
}

function pkgPriceLabel(dinner: NextDinner, pkg: PackageType): string {
  const price = packagePrice(dinner, pkg);
  return price > 0 ? ` — ${Math.round(price).toLocaleString()} AMD` : "";
}

function packagePrice(dinner: NextDinner, pkg: PackageType): number {
  switch (pkg) {
    case "silver": return dinner.silverPrice;
    case "gold": return dinner.goldPrice;
    case "vip": return dinner.vipPrice;
  }
}

function getPackageSeatLimits(dinner: NextDinner): Record<PackageType, number> {
  return {
    silver: dinner.availability.silverLimited
      ? Math.max(0, dinner.availability.silverRemaining)
      : Number.POSITIVE_INFINITY,
    gold: dinner.availability.goldLimited
      ? Math.max(0, dinner.availability.goldRemaining)
      : Number.POSITIVE_INFINITY,
    vip: dinner.availability.vipLimited
      ? Math.max(0, dinner.availability.vipRemaining)
      : Number.POSITIVE_INFINITY,
  };
}

function getSelectablePackagesForGuest({
  index,
  guestPackages,
  availablePackages,
  packageLimits,
}: {
  index: number;
  guestPackages: PackageType[];
  availablePackages: PackageType[];
  packageLimits: Record<PackageType, number>;
}): PackageType[] {
  return availablePackages.filter((pkg) => {
    const usedByOthers = guestPackages.reduce((count, selectedPkg, selectedIndex) => {
      if (selectedIndex === index) {
        return count;
      }
      return selectedPkg === pkg ? count + 1 : count;
    }, 0);

    return packageLimits[pkg] > usedByOthers;
  });
}

function buildPackageSummary(language: Language, guestPackages: PackageType[]): string {
  const counts = new Map<PackageType, number>();
  for (const pkg of guestPackages) {
    counts.set(pkg, (counts.get(pkg) ?? 0) + 1);
  }
  return (["gold", "silver", "vip"] as PackageType[])
    .filter((pkg) => counts.has(pkg))
    .map((pkg) => {
      const count = counts.get(pkg) ?? 0;
      const label = packageLabel(language, pkg);
      return count === 1 ? label : `${count} ${label}`;
    })
    .join(" · ");
}
