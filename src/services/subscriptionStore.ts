// Marine GPS Pro - Subscription, 7-Day Trial & Payment Simulator Store

export type ProPlan = 'none' | 'yearly' | 'monthly' | 'lifetime';

export interface PlanTransaction {
  id: string;
  plan: ProPlan;
  planTitle: string;
  amount: number;
  date: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

export interface SubscriptionState {
  isSubscribed: boolean;
  plan: ProPlan;
  trialActive: boolean;
  trialStartDate: string;
  trialExpiresAt: string;
  isTrialExpired: boolean;
  activePlanExpiry: string;
  lastTransaction?: PlanTransaction;
}

const SUB_STORAGE_KEY = 'gps_fishing_pro_subscription_v1';

// Calculate default dates (7-day trial from now)
const now = new Date();
const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

let currentSubscription: SubscriptionState = {
  isSubscribed: false,
  plan: 'none',
  trialActive: true,
  trialStartDate: now.toISOString(),
  trialExpiresAt: trialEnd.toISOString(),
  isTrialExpired: false,
  activePlanExpiry: trialEnd.toISOString().split('T')[0],
};

const listeners = new Set<(state: SubscriptionState) => void>();

// Load from storage if available
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = window.localStorage.getItem(SUB_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-evaluate trial and plan expiry against current time
      const expDate = new Date(parsed.trialExpiresAt);
      const isTrialOver = !parsed.isSubscribed && new Date() > expDate;
      
      // If subscribed, check if active plan is expired
      let isPlanActive = parsed.isSubscribed;
      if (parsed.isSubscribed && parsed.activePlanExpiry) {
        const planExp = new Date(parsed.activePlanExpiry);
        if (new Date() > planExp) {
          isPlanActive = false;
        }
      }

      currentSubscription = {
        ...parsed,
        isSubscribed: isPlanActive,
        isTrialExpired: isTrialOver,
        trialActive: !isTrialOver && !isPlanActive,
      };
    }
  } catch {
    // Fail gracefully with default state
  }
}

export class SubscriptionStore {
  static getState(): SubscriptionState {
    return currentSubscription;
  }

  static isAccessAllowed(): boolean {
    if (currentSubscription.isSubscribed) {
      if (currentSubscription.activePlanExpiry) {
        const planExp = new Date(currentSubscription.activePlanExpiry).getTime();
        if (Date.now() > planExp) {
          currentSubscription.isSubscribed = false;
          currentSubscription.isTrialExpired = true;
          return false;
        }
      }
      return true;
    }
    
    if (currentSubscription.trialActive && !currentSubscription.isTrialExpired) {
      const expDate = new Date(currentSubscription.trialExpiresAt).getTime();
      if (Date.now() > expDate) {
        currentSubscription.isTrialExpired = true;
        currentSubscription.trialActive = false;
        return false;
      }
      return true;
    }
    return false;
  }

  static getTrialDaysRemaining(): number {
    if (currentSubscription.isSubscribed) return 365;
    if (!currentSubscription.trialActive || currentSubscription.isTrialExpired) return 0;
    if (!currentSubscription.trialExpiresAt) return 0;
    const exp = new Date(currentSubscription.trialExpiresAt).getTime();
    if (isNaN(exp)) return 0;
    const diffMs = exp - Date.now();
    if (diffMs <= 0) return 0;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  static getPlanDaysRemaining(): number {
    if (!currentSubscription.isSubscribed) return 0;
    if (currentSubscription.plan === 'lifetime') return 9999;
    if (!currentSubscription.activePlanExpiry) return 0;
    const exp = new Date(currentSubscription.activePlanExpiry).getTime();
    if (isNaN(exp)) return 0;
    const diffMs = exp - Date.now();
    if (diffMs <= 0) return 0;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  static isTrialExpired(): boolean {
    return currentSubscription.isTrialExpired;
  }

  static activateSubscription(
    plan: 'yearly' | 'monthly' | 'lifetime',
    customExpiryDays?: number
  ): PlanTransaction {
    const days = customExpiryDays ?? (plan === 'yearly' ? 365 : plan === 'monthly' ? 30 : 36500);
    const expDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const amount = plan === 'yearly' ? 950 : plan === 'monthly' ? 100 : 2499;
    const planTitle =
      plan === 'yearly'
        ? 'Yearly Pro Pass'
        : plan === 'monthly'
        ? 'Monthly Fisherman Pass'
        : 'Lifetime Skipper Pass';

    const tx: PlanTransaction = {
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      plan,
      planTitle,
      amount,
      date: new Date().toISOString(),
      status: 'success',
    };

    currentSubscription = {
      ...currentSubscription,
      isSubscribed: true,
      plan,
      trialActive: false,
      isTrialExpired: false,
      activePlanExpiry: plan === 'lifetime' ? '2099-12-31' : expDate.toISOString().split('T')[0],
      lastTransaction: tx,
    };
    this.persist();
    return tx;
  }

  static recordFailedTransaction(
    plan: 'yearly' | 'monthly' | 'lifetime',
    reason: string = 'Payment declined by bank server (Error 4002)'
  ): PlanTransaction {
    const amount = plan === 'yearly' ? 950 : plan === 'monthly' ? 100 : 2499;
    const planTitle =
      plan === 'yearly'
        ? 'Yearly Pro Pass'
        : plan === 'monthly'
        ? 'Monthly Fisherman Pass'
        : 'Lifetime Skipper Pass';

    const tx: PlanTransaction = {
      id: 'TXN-FAIL-' + Math.floor(100000 + Math.random() * 900000),
      plan,
      planTitle,
      amount,
      date: new Date().toISOString(),
      status: 'failed',
      failureReason: reason,
    };

    currentSubscription = {
      ...currentSubscription,
      lastTransaction: tx,
    };
    this.persist();
    return tx;
  }

  // Developer Testing Controls
  static setTrialDaysForTesting(days: number) {
    const newEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    currentSubscription = {
      ...currentSubscription,
      isSubscribed: false,
      plan: 'none',
      trialActive: true,
      isTrialExpired: false,
      trialExpiresAt: newEnd.toISOString(),
      activePlanExpiry: newEnd.toISOString().split('T')[0],
    };
    this.persist();
  }

  static expireTrialForTesting() {
    currentSubscription = {
      ...currentSubscription,
      isSubscribed: false,
      plan: 'none',
      trialActive: false,
      isTrialExpired: true,
      trialExpiresAt: new Date(Date.now() - 1000).toISOString(),
      activePlanExpiry: 'Trial Expired',
    };
    this.persist();
  }

  static expirePlanForTesting() {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    currentSubscription = {
      ...currentSubscription,
      isSubscribed: false,
      trialActive: false,
      isTrialExpired: true,
      activePlanExpiry: `Plan Expired (${pastDate})`,
    };
    this.persist();
  }

  static resetTrial() {
    const freshNow = new Date();
    const freshEnd = new Date(freshNow.getTime() + 7 * 24 * 60 * 60 * 1000);
    currentSubscription = {
      isSubscribed: false,
      plan: 'none',
      trialActive: true,
      trialStartDate: freshNow.toISOString(),
      trialExpiresAt: freshEnd.toISOString(),
      isTrialExpired: false,
      activePlanExpiry: freshEnd.toISOString().split('T')[0],
      lastTransaction: undefined,
    };
    this.persist();
  }

  private static persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(currentSubscription));
      } catch {
        // Silently ignore storage quota or private-browsing restrictions
      }
    }
    listeners.forEach((fn) => {
      try {
        fn(currentSubscription);
      } catch {
        // Suppress listener callback errors
      }
    });
  }

  static subscribe(fn: (state: SubscriptionState) => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }
}
