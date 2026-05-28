import type { PublicUser } from "@neighborhood/shared";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setTokenProvider } from "@/api/client";
import { auth as authApi } from "@/api/endpoints";

const TOKEN_KEY = "neighborhood.auth.token";
const USER_KEY = "neighborhood.auth.user";

interface AuthState {
  token: string | null;
  user: PublicUser | null;
}

interface AuthContextValue extends AuthState {
  ready: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(displayName: string, email: string, password: string, houseLabel?: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [ready, setReady] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setTokenProvider(() => tokenRef.current);
  }, []);

  useEffect(() => {
    tokenRef.current = state.token;
  }, [state.token]);

  useEffect(() => {
    (async () => {
      try {
        const [token, userJson] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (token && userJson) {
          setState({ token, user: JSON.parse(userJson) as PublicUser });
        }
      } catch {
        // ignore — start logged out
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: AuthState) => {
    setState(next);
    if (next.token && next.user) {
      await SecureStore.setItemAsync(TOKEN_KEY, next.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(next.user));
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      await persist({ token: res.token, user: res.user });
    },
    [persist],
  );

  const signUp = useCallback(
    async (displayName: string, email: string, password: string, houseLabel?: string) => {
      const res = await authApi.signup({
        displayName,
        email,
        password,
        houseLabel: houseLabel?.trim() ? houseLabel.trim() : null,
      });
      await persist({ token: res.token, user: res.user });
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    await persist({ token: null, user: null });
  }, [persist]);

  const refresh = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const res = await authApi.me();
      await persist({ token: tokenRef.current, user: res.user });
    } catch {
      await persist({ token: null, user: null });
    }
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, ready, signIn, signUp, signOut, refresh }),
    [state, ready, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
