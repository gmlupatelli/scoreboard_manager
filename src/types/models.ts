export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'system_admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface ScoreboardCustomStyles {
  preset?: 'light' | 'dark' | 'transparent' | 'high-contrast' | 'minimal' | 'custom';
  backgroundColor?: string;
  textColor?: string;
  titleTextColor?: string;
  headerColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  accentColor?: string;
  accentTextColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  rowHoverColor?: string;
  alternateRowTextColor?: string;
  rankHighlightColor?: string;
  rank1Color?: string;
  rank2Color?: string;
  rank3Color?: string;
  rank1Icon?: string;
  rank2Icon?: string;
  rank3Icon?: string;
}

export type ScoreType = 'number' | 'time';
export type TimeFormat = 'hh:mm' | 'hh:mm:ss' | 'mm:ss' | 'mm:ss.s' | 'mm:ss.ss' | 'mm:ss.sss';

export interface Scoreboard {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  sortOrder: 'asc' | 'desc';
  visibility: 'public' | 'private';
  scoreType: ScoreType;
  timeFormat?: TimeFormat | null;
  customStyles?: ScoreboardCustomStyles | null;
  styleScope?: 'main' | 'embed' | 'both';
  createdAt: string;
  updatedAt: string;
  // Optional populated fields
  owner?: UserProfile;
  entryCount?: number;
}

export interface ScoreboardEntry {
  id: string;
  scoreboardId: string;
  name: string;
  score: number;
  details?: string | null;
  createdAt: string;
  updatedAt: string;
  rank?: number; // Calculated on frontend based on score
}

// ============================================================================
// SUBSCRIPTIONS & BILLING TYPES
// ============================================================================

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'paused'
  | 'expired'
  | 'trialing'
  | 'unpaid';

export type BillingInterval = 'monthly' | 'yearly';

export type AppreciationTier = 'supporter' | 'champion' | 'legend' | 'hall_of_famer';

export interface Subscription {
  id: string;
  userId: string;
  lemonsqueezySubscriptionId?: string | null;
  status: SubscriptionStatus;
  statusFormatted?: string | null;
  billingInterval: BillingInterval;
  amountCents: number;
  currency: string;
  tier: AppreciationTier;
  showCreatedBy: boolean;
  showOnSupportersPage: boolean;
  supporterDisplayName?: string | null;
  updatePaymentMethodUrl?: string | null;
  customerPortalUrl?: string | null;
  customerPortalUpdateSubscriptionUrl?: string | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
  paymentProcessor?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryEntry {
  id: string;
  userId: string;
  subscriptionId?: string | null;
  lemonsqueezyOrderId: string;
  orderNumber?: number | null;
  orderIdentifier?: string | null;
  status?: string | null;
  statusFormatted?: string | null;
  currency?: string | null;
  totalCents?: number | null;
  totalUsdCents?: number | null;
  taxCents?: number | null;
  discountTotalCents?: number | null;
  createdAt: string;
  receiptUrl?: string | null;
  orderItemProductName?: string | null;
  orderItemVariantName?: string | null;
  orderItemQuantity?: number | null;
  orderItemPriceCents?: number | null;
}

// ============================================================================
// KIOSK MODE TYPES
// ============================================================================

export type SlideType = 'image' | 'scoreboard';

export interface KioskConfig {
  id: string;
  scoreboardId: string;
  slideDurationSeconds: number;
  scoreboardPosition: number;
  enabled: boolean;
  pinCode?: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional populated fields
  slides?: KioskSlide[];
}

export interface KioskSlide {
  id: string;
  kioskConfigId: string;
  position: number;
  slideType: SlideType;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  durationOverrideSeconds?: number | null;
  fileName?: string | null;
  fileSize?: number | null;
  createdAt: string;
}

export interface KioskConfigInsert {
  scoreboardId: string;
  slideDurationSeconds?: number;
  scoreboardPosition?: number;
  enabled?: boolean;
  pinCode?: string | null;
}

export interface KioskConfigUpdate {
  slideDurationSeconds?: number;
  scoreboardPosition?: number;
  enabled?: boolean;
  pinCode?: string | null;
}

export interface KioskSlideInsert {
  kioskConfigId: string;
  position: number;
  slideType: SlideType;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  durationOverrideSeconds?: number | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export interface KioskSlideUpdate {
  position?: number;
  durationOverrideSeconds?: number | null;
}

// Carousel slide for display (unified type for rendering)
export interface CarouselSlide {
  id: string;
  type: SlideType;
  imageUrl?: string;
  duration: number; // Effective duration in seconds
  position: number;
}
