export type Language = "english" | "armenian" | "russian";

export type TabKey = "home" | "dinners" | "applications" | "profile";

export type ReserveStep = 1 | 2 | 3;

export interface MiniAppUser {
  id: number;
  username: string;
  name: string;
  surname: string;
  phone: string;
  language: Language;
  hobbies: string;
  allergies: string;
  points: number;
  discount: number;
  attendanceCount: number;
  friendsInvited: number;
  referralCode: string;
  referralUsedCode: string;
  totalPayments: number;
  termsAccepted: boolean;
}

export interface DinnerAvailability {
  overallRemaining: number;
  silverRemaining: number;
  goldRemaining: number;
  vipRemaining: number;
  silverLimited: boolean;
  goldLimited: boolean;
  vipLimited: boolean;
}

export interface NextDinner {
  id: number;
  description: string;
  places: number;
  alreadyRegistered: number;
  dinnerDate: string;
  silverSeats: number;
  goldSeats: number;
  vipSeats: number;
  silverPrice: number;
  goldPrice: number;
  vipPrice: number;
  availability: DinnerAvailability;
}

export interface DinnerRecord {
  id: number;
  description: string;
  places: number;
  alreadyRegistered: number;
  activeBookings?: number;
  location?: string;
  dinnerDate: string;
  silverSeats?: number | null;
  goldSeats?: number | null;
  vipSeats?: number | null;
  silverPrice?: number | null;
  goldPrice?: number | null;
  vipPrice?: number | null;
  expired?: boolean;
}

export interface MiniAppApplication {
  packageInfoId: number;
  publicCode: string;
  dinnerId: number;
  dinnerName: string;
  dinnerDate: string;
  menu: string;
  packageType: string;
  guestCount: number;
  price: number;
  status: string;
  tablePreference: string;
  adminNote: string;
  createdAt: string;
}

export interface BootstrapResponse {
  user: MiniAppUser;
  nextDinner: NextDinner | null;
  supportBotUrl: string;
  botUsername: string;
  loyaltyGoal: number;
  customMenuMinimum: number;
}

export interface ProfileDraft {
  phone: string;
  language: Language;
  hobbies: string;
  allergies: string;
}

export interface ReservationDraft extends ProfileDraft {
  guestCount: number;
  guestPackages: PackageType[];
  tablePreference: TablePreference;
  acceptLegalTerms: boolean;
}

export type PackageType = "silver" | "gold" | "vip";

export type TablePreference = "shared" | "private";

export type ApplicationFilter = "all" | "upcoming" | "past" | "cancelled";

export interface ApplicationSummary {
  silver: number;
  gold: number;
  vip: number;
  custom: number;
}
