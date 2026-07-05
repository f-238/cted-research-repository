import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { api, getToken, setToken as persistToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setLoading(false);
      return () => { active = false; };
    }

    api.get("/api/auth/me")
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        persistToken(null);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function refreshUser() {
    const data = await api.get("/api/users/me");
    setUser(data);
    return data;
  }

  async function login(email, password, remember = true) {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);
    try {
      const data = await api.postForm("/api/auth/login", form);
      persistToken(data.access_token, remember);
      const currentUser = data.user;
      flushSync(() => {
        setUser(currentUser);
        setLoading(false);
      });
      return currentUser;
    } catch (err) {
      persistToken(null);
      flushSync(() => {
        setUser(null);
        setLoading(false);
      });
      throw err;
    }
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
