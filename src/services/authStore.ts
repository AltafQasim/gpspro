// Authentication & User Profile Store

export interface AuthState {
  isLoggedIn: boolean;
  phoneNumber: string | null;
  userName: string | null;
  loginTime: string | null;
}

const AUTH_STORAGE_KEY = 'gps_fishing_pro_auth_v1';

let currentAuth: AuthState = {
  isLoggedIn: true, // Default to true so user gets right into the app
  phoneNumber: '9876543210',
  userName: 'Captain Sagar',
  loginTime: new Date().toISOString(),
};

const listeners = new Set<(auth: AuthState) => void>();

// Initialize from storage if available
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      currentAuth = { ...currentAuth, ...JSON.parse(saved) };
    }
  } catch {
    // Fail silently
  }
}

export class AuthStore {
  static getAuth(): AuthState {
    return currentAuth;
  }

  static isLoggedIn(): boolean {
    return currentAuth.isLoggedIn;
  }

  static getPhone(): string | null {
    return currentAuth.phoneNumber;
  }

  static getUserName(): string {
    return currentAuth.userName || 'Captain Sagar';
  }

  static updateProfile(userName: string, phoneNumber?: string) {
    currentAuth = {
      ...currentAuth,
      userName: userName.trim() || currentAuth.userName,
      phoneNumber: phoneNumber ? phoneNumber.trim() : currentAuth.phoneNumber,
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentAuth));
      } catch {
        // Fail silently
      }
    }

    listeners.forEach((fn) => {
      try {
        fn(currentAuth);
      } catch {
        // Fail silently
      }
    });
  }

  static login(phoneNumber: string, userName: string = 'Captain Sagar') {
    currentAuth = {
      isLoggedIn: true,
      phoneNumber: phoneNumber.trim(),
      userName: userName.trim(),
      loginTime: new Date().toISOString(),
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentAuth));
      } catch {
        // Fail silently
      }
    }

    listeners.forEach((fn) => {
      try {
        fn(currentAuth);
      } catch {
        // Fail silently
      }
    });
  }

  static logout() {
    currentAuth = {
      isLoggedIn: false,
      phoneNumber: null,
      userName: null,
      loginTime: null,
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // Fail silently
      }
    }

    listeners.forEach((fn) => {
      try {
        fn(currentAuth);
      } catch {
        // Fail silently
      }
    });
  }

  static subscribe(fn: (auth: AuthState) => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }
}
