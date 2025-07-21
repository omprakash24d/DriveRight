"use client";

import { auth } from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/services/studentsService";
import {
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  getIdToken: () => Promise<string | null>;
  refreshUserProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = useCallback(
    async (firebaseUser: FirebaseUser | null): Promise<void> => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error(
            "Failed to fetch user profile, setting to null.",
            error
          );
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!auth.app) {
      console.warn(
        "Firebase is not configured. Auth state will not be tracked."
      );
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true); // Start loading when auth state changes
      setUser(user);

      // Create session cookie for authenticated users
      if (user) {
        try {
          const idToken = await user.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          });
        } catch (error) {
          console.error("Failed to create session cookie:", error);
        }
      } else {
        // Clear session cookie when user logs out
        try {
          await fetch("/api/auth/session", {
            method: "DELETE",
          });
        } catch (error) {
          console.error("Failed to clear session cookie:", error);
        }
      }

      await fetchUserProfile(user); // Fetch profile for the new user state
      setIsLoading(false); // Stop loading only after user and profile are settled
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      // Force refresh the token to ensure it's not expired.
      // Firebase automatically handles caching, so this is efficient.
      return await user.getIdToken(true);
    } catch (error: any) {
      console.error("Error getting or refreshing ID token:", error);
      // If token refresh fails (e.g., user session is revoked),
      // log the user out to prevent them from being in an invalid state.
      if (
        error.code === "auth/user-token-expired" ||
        error.code === "auth/invalid-user-token"
      ) {
        await handleSignOut();
      }
      return null;
    }
  }, [user, handleSignOut]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  const refreshSession = useCallback(async () => {
    if (user) {
      try {
        // Force refresh the ID token to get updated claims
        const idToken = await user.getIdToken(true);
        // Create new session cookie with updated claims
        await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });
      } catch (error) {
        console.error("Failed to refresh session:", error);
      }
    }
  }, [user]);

  const value = {
    user,
    userProfile,
    isLoading,
    getIdToken,
    refreshUserProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
