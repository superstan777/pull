"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-120 flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs min-h-14 justify-center transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
