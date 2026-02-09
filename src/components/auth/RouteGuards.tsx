import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useProfile } from "@/hooks/useProfile";
import { BiometricLockScreen } from "./BiometricLockScreen";

// Session storage key to track if user unlocked with biometric this session
const BIOMETRIC_UNLOCKED_KEY = "biometric_unlocked";

// Loading component to avoid repetition
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
);

// Hook to check onboarding status - only runs when user exists
// Also creates profile if it doesn't exist (fallback for trigger failure)
const useOnboardingStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["onboarding-status", userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;

      // Check sessionStorage override (set during onboarding import flow, scoped to user)
      if (sessionStorage.getItem(`onboarding_override_${userId}`) === "true") {
        return true;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking onboarding:", error);
        return false;
      }

      // If no profile yet, return false (trigger should have created it)
      if (!data) return false;

      return data.onboarding_completed === true;
    },
    enabled: !!userId,
    staleTime: 0, // Always refetch to get latest onboarding status
    refetchOnMount: "always",
    retry: 2,
  });
};

/**
 * AuthRoute - Protects routes that require authentication only (not onboarding)
 * Used for: /onboarding route
 */
export const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Wait for auth to initialize
  if (loading) {
    return <LoadingScreen />;
  }

  // No authenticated user → redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated → render children
  return <>{children}</>;
};

/**
 * OnboardingRoute - Protects routes that require auth + completed onboarding
 * Also handles biometric lock screen for returning users
 * Used for: All main app routes (/, /history, /settings, etc.)
 */
export const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isEnabled: isBiometricEnabled, isEnabledForUser, isLoading: biometricLoading } = useWebAuthn();
  const { data: profile } = useProfile();
  
  // Track if user has unlocked with biometric this session
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem(BIOMETRIC_UNLOCKED_KEY) === "true";
  });
  
  // IMPORTANT: Only fetch onboarding status when user.id is available
  const { data: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingStatus(
    user?.id
  );

  // Check if biometric is enabled for this specific user
  const userHasBiometric = user?.id ? isEnabledForUser(user.id) : false;

  // Step 1: Wait for auth to initialize first
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Step 2: No authenticated user → redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Step 3: User exists, but still checking onboarding status → show loading
  if (onboardingLoading || biometricLoading) {
    return <LoadingScreen />;
  }

  // Step 4: Onboarding not completed → redirect to onboarding
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Step 5: User has biometric enabled but hasn't unlocked this session → show lock screen
  if (userHasBiometric && !isUnlocked) {
    return (
      <BiometricLockScreen
        userEmail={user.email || ""}
        userName={profile?.full_name || user.user_metadata?.name || user.user_metadata?.full_name || ""}
        onUnlock={() => {
          sessionStorage.setItem(BIOMETRIC_UNLOCKED_KEY, "true");
          setIsUnlocked(true);
        }}
        onUsePassword={() => {
          // Sign out and redirect to login page for password entry
          supabase.auth.signOut();
        }}
      />
    );
  }

  // Step 6: All checks passed → render children
  return <>{children}</>;
};

/**
 * PublicRoute - For public pages that should redirect authenticated users
 * Used for: /auth route
 */
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  
  // IMPORTANT: Only fetch onboarding status when user.id is available
  const { data: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingStatus(
    user?.id
  );

  // Step 1: Wait for auth to initialize first - prevents premature render of login page
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Step 2: No user → show auth page
  if (!user) {
    return <>{children}</>;
  }

  // Step 3: User exists but still checking onboarding → show loading
  if (onboardingLoading) {
    return <LoadingScreen />;
  }

  // Step 4: User exists, onboarding not done → redirect to onboarding
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Step 5: User exists and onboarding done → redirect to home
  return <Navigate to="/" replace />;
};
