import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken as persistToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/auth/me").then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function refreshUser() {
    const data = await api.get("/api/users/me");
    setUser(data);
    return data;
  }

  async function login(email, password) {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);
    const data = await api.postForm("/api/auth/login", form);
    persistToken(data.access_token);
    setUser(data.user);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
  }

  function logout() {
    persistToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser, updateUser, isAdmin: user?.role === "admin" }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
