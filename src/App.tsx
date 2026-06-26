import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { cancelApplication, createApplication, fetchApplications, fetchBootstrap, fetchDinners, sendSupportMessage, updateProfile } from "./api";
import { t } from "./i18n";
import { applyTelegramTheme, getTelegramInitData, observeTelegramViewport, openTelegramUrl } from "./telegram";
import type {
  ApplicationFilter,
  BootstrapResponse,
  DinnerRecord,
  Language,
  MiniAppApplication,
  ProfileDraft,
  ReservationDraft,
  ReserveStep,
  TabKey,
} from "./types";
import { BottomNav } from "./components/BottomNav";
import { ApplicationsScreen } from "./components/ApplicationsScreen";
import { DinnersScreen, DinnerDetailCard } from "./components/DinnersScreen";
import { buildProfileName, getAvailablePackages, mapDinnerRecordToNextDinner } from "./components/formatters";
import { HomeScreen } from "./components/HomeScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { ReserveFlow } from "./components/ReserveFlow";
import { ScreenMessage } from "./components/Primitives";

const DEFAULT_TAB: TabKey = "home";

function toProfileDraft(user: BootstrapResponse["user"]): ProfileDraft {
  return {
    phone: user.phone ?? "",
    language: user.language ?? "english",
    hobbies: user.hobbies ?? "",
    allergies: user.allergies ?? "",
  };
}

function toReservationDraft(user: BootstrapResponse["user"]): ReservationDraft {
  return {
    ...toProfileDraft(user),
    guestCount: 1,
    guestPackages: ["silver"],
    tablePreference: "shared",
    acceptLegalTerms: user.termsAccepted,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(DEFAULT_TAB);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [applications, setApplications] = useState<MiniAppApplication[]>([]);
  const [dinners, setDinners] = useState<DinnerRecord[]>([]);
  const [selectedDinnerId, setSelectedDinnerId] = useState<number | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [reservationDraft, setReservationDraft] = useState<ReservationDraft | null>(null);
  const [reserveStep, setReserveStep] = useState<ReserveStep>(1);
  const [applicationsFilter, setApplicationsFilter] = useState<ApplicationFilter>("all");
  const [reserveMode, setReserveMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingApplicationId, setCancellingApplicationId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    return observeTelegramViewport((snapshot) => {
      root.style.setProperty("--app-viewport-height", `${snapshot.height}px`);
      root.style.setProperty("--app-stable-height", `${snapshot.stableHeight}px`);
      root.style.setProperty("--keyboard-offset", `${snapshot.keyboardInset}px`);
    });
  }, []);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (activeTab !== "applications") {
      return;
    }
    void refreshApplications();
  }, [activeTab]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshApplications();
      }
    }

    function handleFocus() {
      void refreshApplications();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const language: Language = bootstrap?.user.language ?? "english";

  const selectedDinner = useMemo(() => {
    if (!selectedDinnerId) {
      return bootstrap?.nextDinner ?? null;
    }
    const fromList = dinners.find((item) => item.id === selectedDinnerId);
    if (fromList) {
      const availability =
        bootstrap?.nextDinner?.id === fromList.id ? bootstrap.nextDinner.availability : undefined;
      return mapDinnerRecordToNextDinner(fromList, availability);
    }
    return bootstrap?.nextDinner ?? null;
  }, [bootstrap?.nextDinner, dinners, selectedDinnerId]);

  const availablePackages = useMemo(
    () => getAvailablePackages(selectedDinner),
    [selectedDinner],
  );

  async function loadAll(options?: { preserveSubmission?: boolean }) {
    try {
      setLoading(true);
      setError("");
      const [bootstrapPayload, applicationItems, dinnerItems] = await Promise.all([
        fetchBootstrap(),
        fetchApplications(),
        fetchDinners(),
      ]);
      setBootstrap(bootstrapPayload);
      setApplications(applicationItems);
      setDinners(dinnerItems);
      setSelectedDinnerId(bootstrapPayload.nextDinner?.id ?? dinnerItems[0]?.id ?? null);
      setProfileDraft(toProfileDraft(bootstrapPayload.user));
      setReservationDraft(toReservationDraft(bootstrapPayload.user));
      if (!options?.preserveSubmission) {
        setSubmitted(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load app");
    } finally {
      setLoading(false);
    }
  }

  async function refreshApplications() {
    try {
      const applicationItems = await fetchApplications();
      setApplications(applicationItems);
    } catch {
      // Ignore background refresh failures and keep current UI state.
    }
  }

  async function handleProfileSave(): Promise<boolean> {
    if (!profileDraft) {
      return false;
    }
    try {
      setSavingProfile(true);
      const user = await updateProfile(profileDraft);
      setBootstrap((current) => (current ? { ...current, user } : current));
      setReservationDraft((current) =>
        current
          ? {
              ...current,
              phone: user.phone,
              language: user.language,
              hobbies: user.hobbies,
              allergies: user.allergies,
              acceptLegalTerms: user.termsAccepted,
            }
          : current,
      );
      setToast(t(user.language, "profileUpdated"));
      return true;
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed to update profile");
      return false;
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSubmitApplication() {
    if (!selectedDinner || !reservationDraft) {
      return;
    }
    if (!reservationDraft.acceptLegalTerms && !bootstrap?.user.termsAccepted) {
      setToast(t(language, "consentRequired"));
      return;
    }
    try {
      setSubmitting(true);
      const application = await createApplication({
        dinnerId: selectedDinner.id,
        guestCount: reservationDraft.guestCount,
        guestPackages: reservationDraft.guestPackages,
        tablePreference: reservationDraft.tablePreference,
        hobbies: reservationDraft.hobbies,
        allergies: reservationDraft.allergies,
        phone: reservationDraft.phone,
        language: reservationDraft.language,
        acceptLegalTerms: reservationDraft.acceptLegalTerms,
      });
      setApplications((current) => [application, ...current]);
      setSubmitted(true);
      setReserveMode(false);
      setActiveTab("applications");
      setToast(`${t(language, "successApplication")} · ${application.publicCode}`);
      await loadAll({ preserveSubmission: true });
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelApplication(packageInfoId: number) {
    const confirmed = window.confirm(t(language, "cancelApplication"));
    if (!confirmed) {
      return;
    }
    try {
      setCancellingApplicationId(packageInfoId);
      const updated = await cancelApplication(packageInfoId);
      setApplications((current) =>
        current.map((item) => (item.packageInfoId === packageInfoId ? updated : item)),
      );
      await refreshApplications();
      setToast(t(language, "statusCancelled"));
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed to cancel application");
    } finally {
      setCancellingApplicationId(null);
    }
  }

  function handleCopyReferral() {
    const code = bootstrap?.user.referralCode;
    if (!code) {
      return;
    }
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setToast(t(language, "copied"));
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleInviteFriend() {
    if (!bootstrap?.user.referralCode || !bootstrap.botUsername) {
      return;
    }
    const botUsername = bootstrap.botUsername.replace(/^@/, "");
    const shareText = encodeURIComponent(
      `Join Secret Dinner with my referral code: ${bootstrap.user.referralCode}`,
    );
    openTelegramUrl(`https://t.me/share/url?url=https://t.me/${botUsername}&text=${shareText}`);
  }

  async function handleSendSupport(message: string) {
    await sendSupportMessage(message);
  }

  function handleSelectDinner(dinnerId: number) {
    setSelectedDinnerId(dinnerId);
    setReserveStep(1);
    setSubmitted(false);
    setReserveMode(true);
  }

  function handleBackToDinners() {
    setReserveMode(false);
    setSubmitted(false);
    setReserveStep(1);
  }

  function handleGuestCountChange(count: number) {
    setReservationDraft((current) => {
      if (!current) {
        return current;
      }
      const nextCount = Math.max(1, count);
      const fallback = availablePackages[0] ?? "silver";
      return {
        ...current,
        guestCount: nextCount,
        guestPackages: Array.from({ length: nextCount }, (_, index) => current.guestPackages[index] ?? fallback),
      };
    });
  }

  function handlePackageChange(index: number, pkg: ReservationDraft["guestPackages"][number]) {
    setReservationDraft((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        guestPackages: current.guestPackages.map((value, itemIndex) => (itemIndex === index ? pkg : value)),
      };
    });
  }

  if (loading) {
    return <ScreenMessage title={t(language, "loading")} />;
  }

  if (error) {
    const hasTelegramContext = Boolean(getTelegramInitData());
    return (
      <ScreenMessage
        title={error}
        body={hasTelegramContext ? undefined : t("english", "appRequiresTelegram")}
        action={
          <button className="primary-button full-width" onClick={() => void loadAll()}>
            {t("english", "retry")}
          </button>
        }
      />
    );
  }

  if (!bootstrap || !profileDraft || !reservationDraft) {
    return null;
  }

  return (
    <div
      className="app-shell"
    >
      <main className="screen-root">
        {activeTab === "home" ? (
          <HomeScreen
            bootstrap={bootstrap}
            language={language}
            nextDinner={selectedDinner}
            applications={applications}
            copied={copied}
            onReserve={() => setActiveTab("dinners")}
            onCopy={handleCopyReferral}
            onShare={handleInviteFriend}
          />
        ) : null}

        {activeTab === "dinners" && !reserveMode ? (
          <DinnersScreen
            dinners={dinners}
            applications={applications}
            language={language}
            onReserve={handleSelectDinner}
          />
        ) : null}

        {activeTab === "dinners" && reserveMode ? (
          <div className="screen-stack">
            <ReserveFlow
              dinner={selectedDinner}
              language={language}
              step={reserveStep}
              draft={reservationDraft}
              availablePackages={availablePackages}
              submitting={submitting}
              submitted={submitted}
              onStepChange={setReserveStep}
              onGuestCountChange={handleGuestCountChange}
              onPackageChange={handlePackageChange}
              onTableChange={(value) =>
                setReservationDraft((current) => (current ? { ...current, tablePreference: value } : current))
              }
              onFieldChange={(patch) =>
                setReservationDraft((current) => (current ? { ...current, ...patch } : current))
              }
              onSubmit={() => void handleSubmitApplication()}
              onViewApplications={() => { setActiveTab("applications"); setReserveMode(false); }}
              onBackHome={() => { setActiveTab("home"); setReserveMode(false); }}
              onBackToDinners={handleBackToDinners}
            />
          </div>
        ) : null}

        {activeTab === "applications" ? (
          <ApplicationsScreen
            language={language}
            applications={applications}
            dinners={dinners}
            filter={applicationsFilter}
            onFilterChange={setApplicationsFilter}
            onExploreDinners={() => setActiveTab("dinners")}
          />
        ) : null}

        {activeTab === "profile" ? (
          <ProfileScreen
            bootstrap={bootstrap}
            draft={profileDraft}
            language={language}
            applications={applications}
            saving={savingProfile}
            copied={copied}
            onChange={(patch) => setProfileDraft((current) => (current ? { ...current, ...patch } : current))}
            onSave={handleProfileSave}
            onCopy={handleCopyReferral}
            onShare={handleInviteFriend}
            onExploreDinners={() => setActiveTab("dinners")}
            onSendSupport={handleSendSupport}
          />
        ) : null}
      </main>

      <BottomNav
        activeTab={activeTab}
        language={language}
        onChange={setActiveTab}
      />
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
