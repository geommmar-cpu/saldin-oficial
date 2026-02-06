import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/backendClient";

// Types for WebAuthn
interface StoredCredential {
  credentialId: string;
  rawId: string;
  userEmail: string;
  userId: string;
  deviceName: string;
  createdAt: string;
}

interface WebAuthnState {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  credentials: StoredCredential[];
}

// Helper functions for base64 encoding/decoding
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random challenge
function generateChallenge(): ArrayBuffer {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge.buffer as ArrayBuffer;
}

// Get device name based on user agent
function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Dispositivo";
}

// Storage key for credentials
const STORAGE_KEY = "webauthn_credentials";

// Get stored credentials from localStorage
function getStoredCredentials(): StoredCredential[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save credentials to localStorage
function saveCredentials(credentials: StoredCredential[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function useWebAuthn() {
  const [state, setState] = useState<WebAuthnState>({
    isSupported: false,
    isEnabled: false,
    isLoading: true,
    credentials: [],
  });

  // Check if WebAuthn is supported and load credentials
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 
        typeof window !== "undefined" &&
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function";

      let hasAuthenticator = false;
      if (isSupported) {
        try {
          hasAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
          hasAuthenticator = false;
        }
      }

      const credentials = getStoredCredentials();

      setState({
        isSupported: isSupported && hasAuthenticator,
        isEnabled: credentials.length > 0,
        isLoading: false,
        credentials,
      });
    };

    checkSupport();
  }, []);

  // Register a new biometric credential
  const registerBiometric = useCallback(async (userId: string, userEmail: string): Promise<boolean> => {
    if (!state.isSupported) {
      console.error("WebAuthn not supported");
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const challenge = generateChallenge();
      const userIdBuffer = new TextEncoder().encode(userId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Saldin",
          id: window.location.hostname,
        },
        user: {
          id: userIdBuffer,
          name: userEmail,
          displayName: userEmail.split("@")[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Credential creation failed");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Store credential
      const newCredential: StoredCredential = {
        credentialId: credential.id,
        rawId: bufferToBase64(credential.rawId),
        userEmail,
        userId,
        deviceName: getDeviceName(),
        createdAt: new Date().toISOString(),
      };

      const credentials = [...getStoredCredentials(), newCredential];
      saveCredentials(credentials);

      setState(prev => ({
        ...prev,
        isEnabled: true,
        isLoading: false,
        credentials,
      }));

      return true;
    } catch (error) {
      console.error("Error registering biometric:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported]);

  // Authenticate using biometric
  const authenticateWithBiometric = useCallback(async (): Promise<{ success: boolean; userId?: string; userEmail?: string }> => {
    if (!state.isSupported || !state.isEnabled) {
      return { success: false };
    }

    const credentials = getStoredCredentials();
    if (credentials.length === 0) {
      return { success: false };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const challenge = generateChallenge();
      
      const allowCredentials: PublicKeyCredentialDescriptor[] = credentials.map(cred => ({
        id: base64ToBuffer(cred.rawId),
        type: "public-key",
        transports: ["internal"],
      }));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials,
        timeout: 60000,
        userVerification: "required",
        rpId: window.location.hostname,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Authentication failed");
      }

      // Find the matching credential
      const matchedCredential = credentials.find(
        cred => cred.credentialId === assertion.id
      );

      if (!matchedCredential) {
        throw new Error("Credential not found");
      }

      setState(prev => ({ ...prev, isLoading: false }));

      return {
        success: true,
        userId: matchedCredential.userId,
        userEmail: matchedCredential.userEmail,
      };
    } catch (error) {
      console.error("Error authenticating with biometric:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false };
    }
  }, [state.isSupported, state.isEnabled]);

  // Remove a credential
  const removeCredential = useCallback((credentialId: string) => {
    const credentials = getStoredCredentials().filter(
      cred => cred.credentialId !== credentialId
    );
    saveCredentials(credentials);

    setState(prev => ({
      ...prev,
      isEnabled: credentials.length > 0,
      credentials,
    }));
  }, []);

  // Remove all credentials for a user
  const removeAllCredentials = useCallback((userId: string) => {
    const credentials = getStoredCredentials().filter(
      cred => cred.userId !== userId
    );
    saveCredentials(credentials);

    setState(prev => ({
      ...prev,
      isEnabled: credentials.length > 0,
      credentials,
    }));
  }, []);

  // Check if biometric is enabled for a specific user
  const isEnabledForUser = useCallback((userId: string): boolean => {
    return getStoredCredentials().some(cred => cred.userId === userId);
  }, []);

  // Get credentials for a specific user
  const getCredentialsForUser = useCallback((userId: string): StoredCredential[] => {
    return getStoredCredentials().filter(cred => cred.userId === userId);
  }, []);

  return {
    ...state,
    registerBiometric,
    authenticateWithBiometric,
    removeCredential,
    removeAllCredentials,
    isEnabledForUser,
    getCredentialsForUser,
  };
}
