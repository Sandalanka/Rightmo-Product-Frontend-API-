"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CloseButton } from "@/components/ui/CloseButton";
import { Drawer } from "@/components/ui/Drawer";
import { useAuth } from "@/context/AuthContext";
import { isActive, NAV_ITEMS } from "./nav-items";

interface SidebarProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Mobile-only navigation drawer; hidden entirely from md and up (the top navbar is used there). */
export function Sidebar({ id, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Drawer id={id} label="Sidebar" isOpen={isOpen} onClose={onClose} className="md:hidden">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
        <Link href="/dashboard" onClick={onClose} className="text-xl font-extrabold tracking-tight text-brand-500">
          Rightmo
        </Link>
        <CloseButton onClick={onClose} label="Close menu" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        {user && (
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        )}
        <LogoutButton />
      </div>
    </Drawer>
  );
}
