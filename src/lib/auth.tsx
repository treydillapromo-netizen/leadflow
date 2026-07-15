import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface TrialInfo {
  startedAt: string;
  endsAt: string;
  leadsUsed: number;
  maxLeads: number;
}

interface AuthContextType {
  user: User | null;
  trial: TrialInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isTrialExpired: boolean;
  isLeadCapped: boolean;
  refreshTrial: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TRIAL_DAYS = 30;
const TRIAL_MAX_LEADS = 50;

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("leadflow_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredTrial(): TrialInfo | null {
  try {
    const raw = localStorage.getItem("leadflow_trial");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initTrial(): TrialInfo {
  const now = new Date();
  const endsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return {
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    leadsUsed: 0,
    maxLeads: TRIAL_MAX_LEADS,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [trial, setTrial] = useState<TrialInfo | null>(getStoredTrial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no trial but user exists, start one
    if (user && !trial) {
      const newTrial = initTrial();
      setTrial(newTrial);
      localStorage.setItem("leadflow_trial", JSON.stringify(newTrial));
    }
    setLoading(false);
  }, [user, trial]);

  // Listen for trial updates from localStorage (e.g. lead count updated)
  useEffect(() => {
    const handler = () => {
      const stored = getStoredTrial();
      if (stored) setTrial(stored);
    };
    window.addEventListener("storage", handler);
    window.addEventListener("leadflow-trial-update", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("leadflow-trial-update", handler);
    };
  }, []);

  const login = async (email: string, _password: string) => {
    // Try API first, fall back to localStorage mock
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: _password }),
      });
      if (res.ok) {
        const data = await res.json();
        const u: User = { id: data.id, email: data.email, name: data.name };
        setUser(u);
        localStorage.setItem("leadflow_user", JSON.stringify(u));
        return;
      }
    } catch {
      // API not available yet, fall through
    }

    // Mock login for development
    const u: User = { id: "user-1", email, name: email.split("@")[0] };
    setUser(u);
    localStorage.setItem("leadflow_user", JSON.stringify(u));
    if (!trial) {
      const newTrial = initTrial();
      setTrial(newTrial);
      localStorage.setItem("leadflow_trial", JSON.stringify(newTrial));
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (res.ok) {
        const data = await res.json();
        const u: User = { id: data.id, email: data.email, name: data.name };
        setUser(u);
        localStorage.setItem("leadflow_user", JSON.stringify(u));
        const newTrial = initTrial();
        setTrial(newTrial);
        localStorage.setItem("leadflow_trial", JSON.stringify(newTrial));
        return;
      }
    } catch {
      // API not available yet, fall through
    }

    // Mock signup for development
    const u: User = { id: `user-${Date.now()}`, email, name };
    setUser(u);
    localStorage.setItem("leadflow_user", JSON.stringify(u));
    const newTrial = initTrial();
    setTrial(newTrial);
    localStorage.setItem("leadflow_trial", JSON.stringify(newTrial));
  };

  const logout = () => {
    setUser(null);
    setTrial(null);
    localStorage.removeItem("leadflow_user");
    localStorage.removeItem("leadflow_trial");
  };

  const refreshTrial = () => {
    const stored = getStoredTrial();
    if (stored) setTrial(stored);
  };

  const isAuthenticated = user !== null;
  const isTrialExpired = trial ? new Date(trial.endsAt) < new Date() : false;
  const isLeadCapped = trial ? trial.leadsUsed >= trial.maxLeads : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        trial,
        loading,
        login,
        signup,
        logout,
        isAuthenticated,
        isTrialExpired,
        isLeadCapped,
        refreshTrial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function incrementLeadCount() {
  const stored = getStoredTrial();
  if (stored) {
    stored.leadsUsed += 1;
    localStorage.setItem("leadflow_trial", JSON.stringify(stored));
    window.dispatchEvent(new CustomEvent("leadflow-trial-update"));
  }
}

export function getTrialDaysRemaining(trial: TrialInfo): number {
  const now = new Date();
  const end = new Date(trial.endsAt);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}