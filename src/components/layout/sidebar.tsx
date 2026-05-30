"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  Video,
  Type,
  Mic,
  Clock,
  BarChart3,
  Settings,
} from "lucide-react";

const mainNav = [
  { name: "Live Translator", href: "/translator", icon: Video },
  { name: "Text to Sign", href: "/text-to-sign", icon: Type },
  { name: "Voice to Sign", href: "/voice-to-sign", icon: Mic },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-[var(--sidebar-border)]">
        <Link href="/translator" className="flex items-center">
          <Image
            src="/SignBridgelogo.png"
            alt="SignBridge"
            width={180}
            height={36}
            className="h-auto w-full max-w-[180px]"
            priority
            unoptimized
          />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[var(--bg-tertiary)] text-[var(--fg)] font-medium"
                    : "text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)]"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-brand-500" : "text-[var(--fg-tertiary)]")} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
