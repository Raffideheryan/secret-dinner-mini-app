import { useState } from "react";
import { t } from "../i18n";
import type {
  BootstrapResponse,
  Language,
  MiniAppApplication,
  ProfileDraft,
} from "../types";
import {
  buildProfileName,
  formatApplicationPackageSummary,
  formatDateWithTime,
  getInitial,
  isPastDate,
  parseApplicationSummary,
  statusLabel,
  statusTone,
  toProgressPercent,
} from "./formatters";
import { StatusBadge } from "./Primitives";

/* ─── helpers ─── */

function activeApplication(applications: MiniAppApplication[]): MiniAppApplication | null {
  const active = applications.find(a =>
    (a.status === "pending_application" ||
      a.status === "contacted" ||
      a.status === "waiting_payment" ||
      a.status === "approved" ||
      a.status === "paid") &&
    !isPastDate(a.dinnerDate)
  );
  return active ?? null;
}

function favPackageFromHistory(applications: MiniAppApplication[]): string | null {
  const counts: Record<string, number> = {};
  for (const a of applications) {
    if (a.status !== "cancelled" && a.status !== "rejected" && a.status !== "no_show") {
      const s = parseApplicationSummary(a.menu);
      if (s.vip > 0) counts["vip"] = (counts["vip"] ?? 0) + s.vip;
      if (s.gold > 0) counts["gold"] = (counts["gold"] ?? 0) + s.gold;
      if (s.silver > 0) counts["silver"] = (counts["silver"] ?? 0) + s.silver;
    }
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}

function confirmedCount(applications: MiniAppApplication[]): number {
  return applications.filter(a => a.status === "approved" || a.status === "paid").length;
}

/* ─── Sub-components ─── */

function ProfileAvatar({ initial }: { initial: string }) {
  return (
    <div className="pf-avatar">
      <span className="pf-avatar__initial">{initial}</span>
      <div className="pf-avatar__ring" />
    </div>
  );
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="pf-stat-pill">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`pf-card ${className}`}>{children}</div>;
}

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="pf-section-head">
      <h3 className="pf-section-head__title">{title}</h3>
      {action}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="pf-info-row">
      <span className="pf-info-row__icon">{icon}</span>
      <div className="pf-info-row__text">
        <span className="pf-info-row__label">{label}</span>
        <span className={`pf-info-row__value${muted ? " pf-info-row__value--muted" : ""}`}>{value}</span>
      </div>
    </div>
  );
}

function NavRow({
  icon,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
}) {
  return (
    <button className="pf-nav-row" onClick={onClick}>
      <span className="pf-nav-row__icon">{icon}</span>
      <div className="pf-nav-row__text">
        <span className="pf-nav-row__label">{label}</span>
        {sublabel ? <span className="pf-nav-row__sublabel">{sublabel}</span> : null}
      </div>
      <svg className="pf-nav-row__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

/* ─── Edit form modal/sheet ─── */

function EditProfileSheet({
  draft,
  saving,
  language,
  onChange,
  onSave,
  onClose,
}: {
  draft: ProfileDraft;
  saving: boolean;
  language: Language;
  onChange: (patch: Partial<ProfileDraft>) => void;
  onSave: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (draft.phone.trim() && !/^[+\d\s\-()]{5,32}$/.test(draft.phone.trim())) {
      errs.phone = t(language, "profilePhoneInvalid");
    }
    if (draft.hobbies.trim().length > 512) {
      errs.hobbies = t(language, "profileFieldTooLong");
    }
    if (draft.allergies.trim().length > 512) {
      errs.allergies = t(language, "profileFieldTooLong");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const saved = await onSave();
    if (saved) {
      onClose();
    }
  }

  return (
    <div className="pf-sheet-overlay" onClick={onClose}>
      <div className="pf-sheet" onClick={e => e.stopPropagation()}>
        <div className="pf-sheet__handle" />
        <div className="pf-sheet__header">
          <h2 className="pf-sheet__title">{t(language, "editProfile")}</h2>
          <button className="pf-sheet__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="pf-sheet__body">
          {/* Phone */}
          <div className="pf-field">
            <label className="pf-field__label">{t(language, "phone")}</label>
            <input
              className={`pf-field__input${errors.phone ? " pf-field__input--error" : ""}`}
              type="tel"
              inputMode="tel"
              value={draft.phone}
              placeholder="+374 XX XXX XXX"
              onChange={e => {
                onChange({ phone: e.target.value });
                if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
              }}
            />
            {errors.phone ? <span className="pf-field__error">{errors.phone}</span> : null}
          </div>

          {/* Language */}
          <div className="pf-field">
            <label className="pf-field__label">{t(language, "language")}</label>
            <div className="pf-lang-picker">
              {(["english", "armenian", "russian"] as Language[]).map(lang => (
                <button
                  key={lang}
                  className={`pf-lang-btn${draft.language === lang ? " pf-lang-btn--active" : ""}`}
                  onClick={() => onChange({ language: lang })}
                >
                  {lang === "english" ? "EN" : lang === "armenian" ? "ՀՅ" : "RU"}
                </button>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div className="pf-field">
            <label className="pf-field__label">
              {t(language, "hobbies")}
              <span className="pf-field__count">{draft.hobbies.trim().length}/512</span>
            </label>
            <textarea
              className={`pf-field__textarea${errors.hobbies ? " pf-field__textarea--error" : ""}`}
              rows={3}
              value={draft.hobbies}
              placeholder={t(language, "hobbiesPlaceholder")}
              onChange={e => {
                onChange({ hobbies: e.target.value });
                if (errors.hobbies) setErrors(prev => ({ ...prev, hobbies: "" }));
              }}
            />
            {errors.hobbies ? <span className="pf-field__error">{errors.hobbies}</span> : null}
          </div>

          {/* Allergies */}
          <div className="pf-field">
            <label className="pf-field__label">
              {t(language, "allergies")}
              <span className="pf-field__count">{draft.allergies.trim().length}/512</span>
            </label>
            <textarea
              className={`pf-field__textarea${errors.allergies ? " pf-field__textarea--error" : ""}`}
              rows={2}
              value={draft.allergies}
              placeholder={t(language, "allergiesPlaceholder")}
              onChange={e => {
                onChange({ allergies: e.target.value });
                if (errors.allergies) setErrors(prev => ({ ...prev, allergies: "" }));
              }}
            />
            {errors.allergies ? <span className="pf-field__error">{errors.allergies}</span> : null}
          </div>

          <button
            className="pf-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="pf-save-btn__spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {saving ? t(language, "submitting") : t(language, "saveProfile")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Support sheet ─── */

function SupportSheet({
  language,
  onSend,
  onClose,
}: {
  language: Language;
  onSend: (message: string) => Promise<void>;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const charLimit = 1000;

  async function handleSend() {
    const msg = message.trim();
    if (!msg || state === "sending") return;
    setState("sending");
    try {
      await onSend(msg);
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="pf-sheet-overlay" onClick={onClose}>
        <div className="pf-sheet pf-support-sheet" onClick={e => e.stopPropagation()}>
          <div className="pf-sheet__handle" />
          <div className="pf-support-success">
            <div className="pf-support-success__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="pf-support-success__title">{t(language, "supportSent")}</h3>
            <p className="pf-support-success__body">{t(language, "supportSentBody")}</p>
            <button className="pf-save-btn" onClick={onClose}>{t(language, "supportDone")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-sheet-overlay" onClick={onClose}>
      <div className="pf-sheet pf-support-sheet" onClick={e => e.stopPropagation()}>
        <div className="pf-sheet__handle" />

        <div className="pf-sheet__header">
          <div className="pf-support-header">
            <div className="pf-support-header__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="pf-sheet__title">{t(language, "profileHelpSupport")}</h2>
              <p className="pf-support-header__sub">{t(language, "supportSubtitle")}</p>
            </div>
          </div>
          <button className="pf-sheet__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="pf-sheet__body">
          {/* Topic chips */}
          <div className="pf-support-topics">
            {(["supportTopicBooking", "supportTopicPayment", "supportTopicOther"] as const).map(key => (
              <button
                key={key}
                className="pf-support-topic"
                onClick={() => {
                  const chip = t(language, key);
                  setMessage(prev => prev ? prev : chip + ": ");
                }}
              >
                {t(language, key)}
              </button>
            ))}
          </div>

          {/* Message textarea */}
          <div className="pf-field">
            <label className="pf-field__label">
              {t(language, "supportMessage")}
              <span className={`pf-field__count${message.length > charLimit ? " pf-field__count--over" : ""}`}>
                {message.length}/{charLimit}
              </span>
            </label>
            <textarea
              className="pf-field__textarea pf-support-textarea"
              rows={6}
              value={message}
              placeholder={t(language, "supportPlaceholder")}
              maxLength={charLimit + 50}
              onChange={e => setMessage(e.target.value)}
              autoFocus
            />
          </div>

          {state === "error" && (
            <p className="pf-support-error">{t(language, "supportError")}</p>
          )}

          <button
            className="pf-save-btn"
            onClick={handleSend}
            disabled={state === "sending" || !message.trim() || message.length > charLimit}
          >
            {state === "sending" ? (
              <><span className="pf-save-btn__spinner" />{t(language, "supportSending")}</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {t(language, "supportSend")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Icon components ─── */

function IcoUser() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function IcoPhone() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.82A16 16 0 0 0 16 16.91l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
}
function IcoGlobe() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
}
function IcoHeart() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
}
function IcoAllergy() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
function IcoBell() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
function IcoShield() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function IcoCard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
}
function IcoSupport() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function IcoInfo() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
function IcoSignOut() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}
function IcoCopy() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
}
function IcoShare() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
}
function IcoDinner() {
  return <svg width="18" height="18" viewBox="0 0 32 29" fill="currentColor"><path d="M17 4L17 2L19 2C19.553 2 20 1.553 20 1C20 0.448 19.553 0 19 0L13 0C12.447 0 12 0.448 12 1C12 1.553 12.447 2 13 2L15 2L15 4C6.632 4.519 0 11.501 0 20L0 21C0 21.553 0.447 22 1 22L31 22C31.553 22 32 21.553 32 21L32 20C32 11.501 25.368 4.519 17 4Z" /><path d="M31 24L1 24C0.447 24 0 24.448 0 25C0 25.553 0.447 26 1 26L31 26C31.553 26 32 25.553 32 25C32 24.448 31.553 24 31 24Z" /></svg>;
}
function IcoCalendar() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function IcoStar() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function IcoAward() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>;
}
function IcoEdit() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

/* ─── Main screen ─── */

export function ProfileScreen({
  bootstrap,
  draft,
  language,
  applications,
  saving,
  copied,
  onChange,
  onSave,
  onCopy,
  onShare,
  onExploreDinners,
  onSendSupport,
}: {
  bootstrap: BootstrapResponse;
  draft: ProfileDraft;
  language: Language;
  applications: MiniAppApplication[];
  saving: boolean;
  copied: boolean;
  onChange: (patch: Partial<ProfileDraft>) => void;
  onSave: () => Promise<boolean>;
  onCopy: () => void;
  onShare: () => void;
  onExploreDinners: () => void;
  onSendSupport: (message: string) => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const user = bootstrap.user;
  const displayName = buildProfileName(user.name, user.surname, user.username);
  const initial = getInitial(user.name, user.surname, user.username);
  const progressPct = toProgressPercent(user.points, bootstrap.loyaltyGoal);
  const ptsNeeded = Math.max(0, bootstrap.loyaltyGoal - user.points);

  const activeApp = activeApplication(applications);
  const favPkg = favPackageFromHistory(applications);
  const confirmed = confirmedCount(applications);
  const totalApps = applications.length;

  const langLabel =
    language === "armenian" ? "Հայերեն" :
    language === "russian" ? "Русский" : "English";

  return (
    <div className="pf-screen">
      {/* ── 1. Header card ── */}
      <div className="pf-hero-card">
        {/* Settings gear top-right */}
        <button
          className="pf-hero-card__settings"
          onClick={() => setEditOpen(true)}
          aria-label={t(language, "editProfile")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Avatar + name row */}
        <div className="pf-hero-card__top">
          <ProfileAvatar initial={initial} />
          <div className="pf-hero-card__identity">
            <h1 className="pf-hero-card__name">{displayName}</h1>
            {user.username ? (
              <span className="pf-hero-card__username">@{user.username}</span>
            ) : null}
            {user.phone ? (
              <span className="pf-hero-card__phone">{user.phone}</span>
            ) : null}
          </div>
        </div>

        {/* Stats strip */}
        <div className="pf-stats-strip">
          <StatPill value={user.attendanceCount} label={t(language, "profileDinnersAttended")} />
          <div className="pf-stats-strip__divider" />
          <StatPill value={user.points} label={t(language, "points")} />
          <div className="pf-stats-strip__divider" />
          <StatPill value={user.friendsInvited} label={t(language, "invited")} />
        </div>

        {/* Loyalty progress */}
        <div className="pf-loyalty">
          <div className="pf-loyalty__labels">
            <span className="pf-loyalty__label">{t(language, "profileLoyaltyProgress")}</span>
            <span className="pf-loyalty__pts">
              {ptsNeeded > 0
                ? `${user.points} / ${bootstrap.loyaltyGoal} pts`
                : `${user.points} pts ✦`}
            </span>
          </div>
          <div className="pf-loyalty__bar">
            <div className="pf-loyalty__fill" style={{ width: `${progressPct}%` }} />
          </div>
          {ptsNeeded > 0 ? (
            <p className="pf-loyalty__hint">{ptsNeeded} {t(language, "ptsAway")} {t(language, "nextDiscount")}</p>
          ) : (
            <p className="pf-loyalty__hint pf-loyalty__hint--gold">{t(language, "profileDiscountUnlocked")}</p>
          )}
        </div>
      </div>

      {/* ── 2. Active reservation ── */}
      <div className="pf-card pf-reservation-card">
        <SectionHead title={t(language, "profileActiveReservation")} />
        {activeApp ? (
          <div className="pf-reservation">
            <div className="pf-reservation__top">
              <div className="pf-reservation__icon">
                <IcoDinner />
              </div>
              <div className="pf-reservation__info">
                <span className="pf-reservation__title">{activeApp.dinnerName}</span>
                <div className="pf-reservation__meta">
                  <IcoCalendar />
                  <span>{formatDateWithTime(activeApp.dinnerDate)}</span>
                </div>
              </div>
              <StatusBadge
                label={statusLabel(language, activeApp.status)}
                tone={statusTone(activeApp.status)}
              />
            </div>
            <div className="pf-reservation__pills">
              <span className="pf-reservation__pill">
                {formatApplicationPackageSummary(language, parseApplicationSummary(activeApp.menu))}
              </span>
              {activeApp.publicCode ? (
                <span className="pf-reservation__pill pf-reservation__pill--code">
                  {activeApp.publicCode}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="pf-reservation--empty">
            <p className="pf-reservation__empty-text">{t(language, "profileNoReservation")}</p>
            <button className="pf-explore-btn" onClick={onExploreDinners}>
              {t(language, "exploreDinners")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Dinner history ── */}
      <div className="pf-card">
        <SectionHead title={t(language, "profileDinnerHistory")} />
        <div className="pf-history-grid">
          <div className="pf-history-cell">
            <IcoDinner />
            <strong>{user.attendanceCount}</strong>
            <span>{t(language, "profileAttended")}</span>
          </div>
          <div className="pf-history-cell">
            <IcoAward />
            <strong>{confirmed}</strong>
            <span>{t(language, "confirmed")}</span>
          </div>
          <div className="pf-history-cell">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <strong>{totalApps}</strong>
            <span>{t(language, "allApplications")}</span>
          </div>
          {favPkg ? (
            <div className="pf-history-cell pf-history-cell--fav">
              <IcoStar />
              <strong className={`pf-pkg-badge pf-pkg-badge--${favPkg}`}>
                {favPkg.charAt(0).toUpperCase() + favPkg.slice(1)}
              </strong>
              <span>{t(language, "profileFavPackage")}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── 4. Personal info ── */}
      <div className="pf-card">
        <SectionHead
          title={t(language, "profilePersonalInfo")}
          action={
            <button className="pf-edit-trigger" onClick={() => setEditOpen(true)}>
              <IcoEdit />
              {t(language, "editProfile")}
            </button>
          }
        />
        <div className="pf-info-list">
          <InfoRow icon={<IcoPhone />} label={t(language, "phone")} value={user.phone || t(language, "notSet")} muted={!user.phone} />
          <InfoRow icon={<IcoGlobe />} label={t(language, "language")} value={langLabel} />
          <InfoRow icon={<IcoHeart />} label={t(language, "hobbies")} value={user.hobbies || t(language, "notSet")} muted={!user.hobbies} />
          <InfoRow icon={<IcoAllergy />} label={t(language, "allergies")} value={user.allergies || t(language, "notSet")} muted={!user.allergies} />
        </div>
      </div>

      {/* ── 5. Referral ── */}
      <div className="pf-card">
        <SectionHead title={t(language, "referralCode")} />
        <div className="pf-referral-box">
          <span className="pf-referral-code">{user.referralCode || "—"}</span>
          <div className="pf-referral-actions">
            <button className="pf-referral-btn" onClick={onCopy}>
              <IcoCopy />
              {copied ? t(language, "copied") : t(language, "copy")}
            </button>
            <button className="pf-referral-btn pf-referral-btn--gold" onClick={onShare}>
              <IcoShare />
              {t(language, "inviteFriend")}
            </button>
          </div>
        </div>
        <div className="pf-referral-stat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{user.friendsInvited} {t(language, "profileFriendsInvited")}</span>
        </div>
      </div>

      {/* ── 6. Settings menu ── */}
      <div className="pf-card pf-menu-card">
        <NavRow
          icon={<IcoUser />}
          label={t(language, "profilePersonalInfo")}
          sublabel={t(language, "profilePersonalInfoSub")}
          onClick={() => setEditOpen(true)}
        />
        <div className="pf-menu-divider" />
        <NavRow
          icon={<IcoBell />}
          label={t(language, "profileNotifications")}
          sublabel={t(language, "profileNotificationsSub")}
        />
        <div className="pf-menu-divider" />
        <NavRow
          icon={<IcoSupport />}
          label={t(language, "profileHelpSupport")}
          sublabel={t(language, "profileHelpSupportSub")}
          onClick={() => setSupportOpen(true)}
        />
        <div className="pf-menu-divider" />
        <NavRow
          icon={<IcoInfo />}
          label={t(language, "profileAbout")}
          sublabel={t(language, "profileAboutSub")}
        />
      </div>

      {/* ── Support sheet ── */}
      {supportOpen ? (
        <SupportSheet
          language={language}
          onSend={onSendSupport}
          onClose={() => setSupportOpen(false)}
        />
      ) : null}

      {/* ── Edit sheet ── */}
      {editOpen ? (
        <EditProfileSheet
          draft={draft}
          saving={saving}
          language={language}
          onChange={onChange}
          onSave={onSave}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </div>
  );
}
