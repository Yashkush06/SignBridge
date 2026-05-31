import { create } from "zustand";
import type { UserProfile } from "@/lib/ml/types";

interface AuthState {
  user: UserProfile | null;
  firebaseUser: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null, firebaseUser: any | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_GUEST_USER: UserProfile = {
  id: "guest-user",
  name: "Guest User",
  email: "guest@signbridge.ai",
  plan: "free",
  createdAt: new Date().toISOString(),
  preferences: {
    theme: "system",
    language: "en-US",
    detectionModel: "alphabet-nn",
    confidenceThreshold: 0.65,
    autoSpeak: false,
    showLandmarks: true
  }
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: DEFAULT_GUEST_USER,
  firebaseUser: null,
  isAuthenticated: true,
  isLoading: false,

  setUser: (user, firebaseUser) => set({ user, firebaseUser, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    // No-op since auth is removed
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, ...updates } });
  },
}));

export const initAuthListener = () => {
  // No-op - immediately resolved as guest
};
