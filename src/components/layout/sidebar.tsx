"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { useAuthStore } from "@/store/auth-store";
import { selectActiveNavItem, type NavItem } from "@/lib/navigation";
import {
  Video,
  Type,
  Mic,
  Clock,
  BarChart3,
  ChevronRight
} from "lucide-react";

const navigationGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { name: "Live Translator", href: "/translator", icon: Video },
      { name: "Text to Sign", href: "/text-to-sign", icon: Type },
      { name: "Voice to Sign", href: "/voice-to-sign", icon: Mic },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "History Feed", href: "/history", icon: Clock },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },

];

// Flatten every group's items into a single NavItem[] so the active-item
// selector resolves exactly one active item across the whole sidebar (Req 8.5).
const navItems: NavItem[] = navigationGroups.flatMap((group) => group.items);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const handleLogout = () => {
    setUser(null, null);
    router.push("/login");
  };

  // Compute the single active item once across ALL nav items (Req 8.5). The
  // longest-prefix selector resolves nested routes to exactly one item, so the
  // previous per-item `startsWith` logic (and its `/translator` special-case)
  // is no longer needed.
  const activeItem = selectActiveNavItem(pathname, navItems);

  return (
    <aside className="flex h-full w-60 flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] select-none">
      {/* Dynamic Logo Branding Header */}
      <div className="flex h-14 items-center px-5 border-b border-[var(--sidebar-border)] shrink-0">
        <Link href="/translator" className="flex items-center hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>
      </div>

      {/* Navigation Links Grouped Semantically */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-thin">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeItem?.href === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group",
                      isActive
                        ? "bg-[var(--bg-tertiary)] text-[var(--fg)] font-medium shadow-2xs"
                        : "text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive
                            ? "text-brand-500"
                            : "text-[var(--fg-tertiary)] group-hover:text-[var(--fg)]"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3 h-3 text-[var(--fg-muted)] opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>


    </aside>
  );
}
