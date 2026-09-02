import { createContext, useContext, useEffect, useMemo, useState } from "react";

import authApi from "../api/authApi";
import { clearStoredToken, getStoredToken, setStoredToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const initializeSession = async () => {
    try {
      const token = getStoredToken();

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      clearStoredToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeSession();
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);

    if (!response?.access_token) {
      throw new Error("Authentication failed");
    }

    setStoredToken(response.access_token);
    const currentUser = await authApi.getCurrentUser();

    setUser(currentUser);
    setIsAuthenticated(true);

    return currentUser;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    return response;
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      initializeSession,
    }),
    [user, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default AuthContext;
