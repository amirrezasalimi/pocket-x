"use client";

import type React from "react";
import { useState } from "react";
import PocketBase from "pocketbase";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Loader2 } from "lucide-react";
import { LocalStorageManager } from "@/shared/utils/localStorage";
import { DEFAULTS } from "@/shared/constants";

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [baseUrl, setBaseUrl] = useState<string>(DEFAULTS.BASE_URL);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Create PocketBase instance
      const pb = new PocketBase(baseUrl);

      // Authenticate with PocketBase using the SDK
      const authData = await pb
        .collection("_superusers")
        .authWithPassword(username, password);

      // Save authentication data to localStorage using utility
      LocalStorageManager.setBaseUrl(baseUrl);
      LocalStorageManager.setAuthData({
        token: authData.token,
        record: authData.record,
      });

      onLogin();
    } catch (err: unknown) {
      // Handle PocketBase SDK errors
      const error = err as {
        response?: { message?: string };
        message?: string;
      };
      if (error.response) {
        setError(error.response.message || "Authentication failed");
      } else {
        setError(error.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-4 min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pocket X</CardTitle>
          <CardDescription>
            Connect to your PocketBase instance to explore and query collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://127.0.0.1:8090"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username/Email</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
              Connect
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
