"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch {
      // Session is cleared locally regardless; nothing else to do.
    } finally {
      // Drop cached data from this user's session (e.g. "my rating").
      queryClient.clear();
      toast.success("You have been logged out.");
      router.replace("/login");
    }
  };

  return (
    <Button variant="secondary" onClick={handleLogout} isLoading={isLoading}>
      Log out
    </Button>
  );
}
