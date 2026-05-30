"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAppStore } from "@/store/app-store";
import { Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useAppStore();

  // Extract current page name from pathname
  const pageName = pathname.split("/")[1] || "Translator";
  const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, " ");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden w-8 h-8 p-0"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--fg-secondary)]">
          <span>Application</span>
          <span>/</span>
          <span className="font-medium text-[var(--fg)]">{formattedPageName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
