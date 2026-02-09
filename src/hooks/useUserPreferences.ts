import { useState, useEffect, useCallback, useRef } from "react";
import { UserPreferences } from "@/types/expense";
import { supabase } from "@/lib/backendClient";

const DEFAULT_PREFERENCES: UserPreferences = {
  aiName: "Assistente",
  userChallenge: undefined,
  darkMode: false,
  alertFrequency: "normal",
  connectedBanks: [],
  whatsappConnected: false,
  onboardingCompleted: false,
  fixedIncome: 0,
  variableIncome: 0,
  cryptoEnabled: false,
};

// Keys that are persisted to the backend (profiles table)
const DB_SYNCED_KEYS: (keyof UserPreferences)[] = ["darkMode", "cryptoEnabled"];

// Map frontend key names to DB column names
const KEY_TO_COLUMN: Record<string, string> = {
  darkMode: "dark_mode",
  cryptoEnabled: "crypto_enabled",
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem("user_preferences");
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }

    // Migrate from old keys if present
    const aiName = localStorage.getItem("ai_name");
    const challenge = localStorage.getItem("user_challenge");
    const completed = localStorage.getItem("onboarding_completed") === "true";
    const fixedIncome = parseFloat(localStorage.getItem("fixed_income") || "0");
    const variableIncome = parseFloat(localStorage.getItem("variable_income") || "0");

    return {
      ...DEFAULT_PREFERENCES,
      aiName: aiName || DEFAULT_PREFERENCES.aiName,
      userChallenge: challenge || undefined,
      onboardingCompleted: completed,
      fixedIncome,
      variableIncome,
    };
  });

  const hasSyncedFromDb = useRef(false);

  // Persist to localStorage on change and sync dark mode class
  useEffect(() => {
    localStorage.setItem("user_preferences", JSON.stringify(preferences));
    document.documentElement.classList.toggle("dark", preferences.darkMode);
  }, [preferences]);

  // On mount (and when auth changes), fetch settings from DB
  useEffect(() => {
    const fetchFromDb = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("dark_mode, crypto_enabled")
        .eq("user_id", session.user.id)
        .maybeSingle() as { data: { dark_mode?: boolean; crypto_enabled?: boolean } | null; error: any };

      if (error) {
        console.error("Error fetching user settings:", error);
        return;
      }

      if (data) {
        hasSyncedFromDb.current = true;
        setPreferences((prev) => ({
          ...prev,
          darkMode: data.dark_mode ?? prev.darkMode,
          cryptoEnabled: data.crypto_enabled ?? prev.cryptoEnabled,
        }));
      }
    };

    fetchFromDb();

    // Also listen for auth changes (login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") {
          hasSyncedFromDb.current = false;
          fetchFromDb();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Save a DB-synced preference to the backend
  const saveToDb = useCallback(async (key: keyof UserPreferences, value: unknown) => {
    const column = KEY_TO_COLUMN[key];
    if (!column) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from("profiles")
      .update({ [column]: value } as any)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(`Error saving ${key} to DB:`, error);
    }
  }, []);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));

    // If this is a DB-synced key, persist to backend
    if (DB_SYNCED_KEYS.includes(key)) {
      saveToDb(key, value);
    }
  }, [saveToDb]);

  const resetPreferences = useCallback(() => {
    // Preserve DB-synced settings during logout
    setPreferences((prev) => ({
      ...DEFAULT_PREFERENCES,
      darkMode: prev.darkMode,
      cryptoEnabled: prev.cryptoEnabled,
    }));
    // Clean up old migration keys only
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("ai_name");
    localStorage.removeItem("user_challenge");
    localStorage.removeItem("fixed_income");
    localStorage.removeItem("variable_income");
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}
