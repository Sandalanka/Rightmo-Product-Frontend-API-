"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function LogoutButton({ className = "" }: { className?: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch {
      // Session is cleared locally regardless; nothing else to do.
    } finally {
      router.replace("/login");
    }
  };

  return (
    <Button variant="secondary" onClick={handleLogout} isLoading={isLoading} className={className}>
      Log out
    </Button>
  );
}
