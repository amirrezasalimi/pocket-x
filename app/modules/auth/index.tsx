"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/shared/components/login-form";
import { LocalStorageManager } from "@/shared/utils/localStorage";
import { useNavigate } from "react-router";

export default function HomePage() {
  const nav = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const baseUrl = LocalStorageManager.getBaseUrl();
    const authData = LocalStorageManager.getAuthData();

    if (baseUrl && authData) {
      // Try to validate the auth by making a quick request
      try {
        const PocketBase = (await import("pocketbase")).default;
        const pb = new PocketBase(baseUrl);
        pb.authStore.save(authData.token, authData.record as unknown as any);

        await pb.collection("_superusers").authRefresh();
        setIsAuthenticated(true);
        nav("/dashboard");
      } catch (error) {
        console.warn("Auth validation failed:", error);
        // Clear invalid auth data
        LocalStorageManager.removeAuthData();
        LocalStorageManager.removeBaseUrl();
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    nav("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-gray-900 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return <LoginForm onLogin={handleLogin} />;
}
