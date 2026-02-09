import { useState, useEffect, useCallback } from "react";
import { UserPreferences } from "@/types/expense";

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

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Load from localStorage on init
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

  // Persist to localStorage on change and sync dark mode class
  useEffect(() => {
    localStorage.setItem("user_preferences", JSON.stringify(preferences));
    document.documentElement.classList.toggle("dark", preferences.darkMode);
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem("user_preferences");
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
