import type {
  BootstrapResponse,
  DinnerRecord,
  MiniAppApplication,
  MiniAppUser,
} from "./types";
import { getTelegramDevUserId, getTelegramInitData } from "./telegram";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

type ErrorPayload = {
  error?: string;
  message?: string;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const initData = getTelegramInitData();
  const devUserId = getTelegramDevUserId();

  if (initData) {
    headers.set("X-Telegram-Init-Data", initData);
  } else if (devUserId) {
    headers.set("X-Telegram-Dev-User", devUserId);
  }

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const payload = (await response.json().catch(() => ({}))) as ErrorPayload;
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed");
  }
  return payload as T;
}

export function fetchBootstrap(): Promise<BootstrapResponse> {
  return apiFetch<BootstrapResponse>("/telegram-mini/bootstrap");
}

export async function fetchApplications(): Promise<MiniAppApplication[]> {
  const response = await apiFetch<{ applications: MiniAppApplication[] }>(
    "/telegram-mini/applications",
  );
  return response.applications ?? [];
}

export async function fetchDinners(): Promise<DinnerRecord[]> {
  const response = await apiFetch<{ dinners: DinnerRecord[] }>("/dinners/info");
  return response.dinners ?? [];
}

export async function updateProfile(body: {
  phone: string;
  language: string;
  hobbies: string;
  allergies: string;
}): Promise<MiniAppUser> {
  const response = await apiFetch<{ user: MiniAppUser }>(
    "/telegram-mini/profile",
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return response.user;
}

export async function createApplication(body: {
  dinnerId: number;
  guestCount: number;
  guestPackages: string[];
  tablePreference: string;
  hobbies: string;
  allergies: string;
  phone: string;
  language: string;
  acceptLegalTerms: boolean;
}): Promise<MiniAppApplication> {
  const response = await apiFetch<{ application: MiniAppApplication }>(
    "/telegram-mini/applications",
    {
      method: "POST",
      body: JSON.stringify({
        ...body,
        customMenuItemIds: [],
      }),
    },
  );
  return response.application;
}

export async function cancelApplication(packageInfoId: number): Promise<MiniAppApplication> {
  const response = await apiFetch<{ application: MiniAppApplication }>(
    `/telegram-mini/applications/${packageInfoId}/cancel`,
    {
      method: "POST",
    },
  );
  return response.application;
}

export async function sendSupportMessage(message: string): Promise<void> {
  await apiFetch<{ ok: boolean }>("/telegram-mini/support", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
