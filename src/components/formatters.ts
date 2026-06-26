import { t } from "../i18n";
import type {
  ApplicationSummary,
  DinnerAvailability,
  DinnerRecord,
  Language,
  MiniAppApplication,
  NextDinner,
  PackageType,
} from "../types";

export function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString()} AMD`;
}

export function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDate(value?: string): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateWithTime(value?: string): string {
  if (!value) {
    return "—";
  }
  const d = new Date(value);
  const datePart = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${datePart} · ${timePart}`;
}

export function isDinnerExpired(dinner: DinnerRecord): boolean {
  return !!(dinner.expired || isPastDate(dinner.dinnerDate));
}

export function getDinnerFilterStatus(dinner: DinnerRecord): "upcoming" | "past" | "cancelled" {
  if (dinner.expired || isPastDate(dinner.dinnerDate)) {
    return "past";
  }
  return "upcoming";
}

export function countDinnerSeatsLeft(dinner: DinnerRecord): number {
  return Math.max(0, (dinner.places ?? 0) - (dinner.alreadyRegistered ?? 0));
}

export function buildProfileName(name: string, surname: string, username: string): string {
  const full = `${name} ${surname}`.trim();
  return full || username || "Guest";
}

export function getInitial(name: string, surname: string, username: string): string {
  const value = buildProfileName(name, surname, username).trim();
  return value.charAt(0).toUpperCase() || "S";
}

export function getGreetingName(name: string, surname: string, username: string): string {
  return buildProfileName(name, surname, username);
}

export function getPointsRemaining(points: number, loyaltyGoal: number): number {
  return Math.max(0, loyaltyGoal - Math.max(0, points));
}

export function toProgressPercent(points: number, loyaltyGoal: number): number {
  if (loyaltyGoal <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (points / loyaltyGoal) * 100));
}

export function mapDinnerRecordToNextDinner(
  dinner: DinnerRecord,
  fallback?: DinnerAvailability,
): NextDinner {
  const places = dinner.places ?? 0;
  const alreadyRegistered = dinner.alreadyRegistered ?? 0;
  const silverSeats = dinner.silverSeats ?? 0;
  const goldSeats = dinner.goldSeats ?? 0;
  const vipSeats = dinner.vipSeats ?? 0;

  return {
    id: dinner.id,
    description: dinner.description,
    places,
    alreadyRegistered,
    dinnerDate: dinner.dinnerDate,
    silverSeats,
    goldSeats,
    vipSeats,
    silverPrice: dinner.silverPrice ?? 0,
    goldPrice: dinner.goldPrice ?? 0,
    vipPrice: dinner.vipPrice ?? 0,
    availability:
      fallback ?? {
        overallRemaining: Math.max(0, places - alreadyRegistered),
        silverRemaining: Math.max(0, silverSeats),
        goldRemaining: Math.max(0, goldSeats),
        vipRemaining: Math.max(0, vipSeats),
        silverLimited: silverSeats > 0,
        goldLimited: goldSeats > 0,
        vipLimited: vipSeats > 0,
      },
  };
}

export function getAvailablePackages(dinner: NextDinner | null): PackageType[] {
  if (!dinner) {
    return [];
  }
  return [
    dinner.silverPrice > 0 ? "silver" : null,
    dinner.goldPrice > 0 ? "gold" : null,
    dinner.vipPrice > 0 ? "vip" : null,
  ].filter(Boolean) as PackageType[];
}

export function packageLabel(language: Language, value: PackageType): string {
  switch (value) {
    case "silver":
      return t(language, "packageSilver");
    case "gold":
      return t(language, "packageGold");
    case "vip":
      return t(language, "packageVip");
  }
}

export function statusLabel(language: Language, value: string): string {
  switch (value) {
    case "pending_application":
      return t(language, "statusPending");
    case "contacted":
      return t(language, "statusContacted");
    case "approved":
      return t(language, "statusApproved");
    case "waiting_payment":
      return t(language, "statusWaitingPayment");
    case "paid":
      return t(language, "statusPaid");
    case "cancelled":
    case "rejected":
      return t(language, "statusCancelled");
    default:
      return value;
  }
}

export function statusTone(value: string): "gold" | "green" | "red" | "slate" {
  switch (value) {
    case "approved":
    case "paid":
      return "green";
    case "cancelled":
    case "rejected":
      return "red";
    case "pending_application":
    case "waiting_payment":
      return "slate";
    default:
      return "slate";
  }
}

export function canCancelApplication(item: MiniAppApplication, now = new Date()): boolean {
  if (!["pending_application", "contacted", "waiting_payment"].includes(item.status)) {
    return false;
  }
  const dinnerDate = new Date(item.dinnerDate);
  if (Number.isNaN(dinnerDate.getTime())) {
    return false;
  }
  const cutoff = new Date(now.getTime() + 60 * 60 * 1000 * 60);
  return dinnerDate.getTime() > cutoff.getTime();
}

export function dinnerBadge(
  dinnerId: number,
  applications: MiniAppApplication[],
): { label: string; tone: "gold" | "green" | "red" | "slate" } {
  const current = applications.find((item) => item.dinnerId === dinnerId);
  if (!current) {
    return { label: "Open", tone: "slate" };
  }
  return {
    label:
      current.status === "approved" || current.status === "paid"
        ? "Confirmed"
        : current.status === "cancelled" || current.status === "rejected"
          ? "Cancelled"
          : "Pending",
    tone:
      current.status === "approved" || current.status === "paid"
        ? "green"
        : current.status === "cancelled" || current.status === "rejected"
          ? "red"
          : "slate",
  };
}

export function countSeatsLeft(dinner: NextDinner): number {
  return Math.max(0, dinner.availability.overallRemaining);
}

export function parseApplicationSummary(menu: string): ApplicationSummary {
  const result: ApplicationSummary = {
    silver: 0,
    gold: 0,
    vip: 0,
    custom: 0,
  };
  const normalized = menu.trim().toLowerCase();
  if (!normalized) {
    return result;
  }
  if (normalized === "silver" || normalized === "gold" || normalized === "vip") {
    result[normalized] = 1;
    return result;
  }
  if (normalized.includes("guest_")) {
    for (const part of normalized.split(",")) {
      const pieces = part.split(":");
      const pkg = pieces[1]?.trim();
      if (pkg === "silver" || pkg === "gold" || pkg === "vip") {
        result[pkg] += 1;
      }
    }
    return result;
  }
  result.custom = 1;
  return result;
}

export function formatApplicationPackageSummary(
  language: Language,
  summary: ApplicationSummary,
): string {
  const parts: string[] = [];
  if (summary.gold > 0) {
    parts.push(formatCountPackage(language, summary.gold, "gold"));
  }
  if (summary.silver > 0) {
    parts.push(formatCountPackage(language, summary.silver, "silver"));
  }
  if (summary.vip > 0) {
    parts.push(formatCountPackage(language, summary.vip, "vip"));
  }
  if (summary.custom > 0) {
    parts.push("Custom");
  }
  return parts.join(" · ") || "—";
}

function formatCountPackage(language: Language, count: number, pkg: PackageType): string {
  const label = packageLabel(language, pkg);
  return count === 1 ? label : `${count} ${label}`;
}

export function isPastDate(dateValue: string): boolean {
  return new Date(dateValue).getTime() < Date.now();
}
