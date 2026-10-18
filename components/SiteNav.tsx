"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/today", label: "Today" },
  { href: "/log", label: "Log" },
  { href: "/week", label: "Last 7 days" },
  { href: "/targets", label: "Targets" },
] as const;

// Shared navigation: pills in the header on wider screens, a bottom tab bar on
// phones. Hidden on the welcome screen, which has one job: Get started.
export function SiteNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0"
    >
      <ul className="flex justify-around gap-1 sm:justify-end">
        {links.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold sm:px-4 sm:text-[15px] ${
                  current ? "bg-leaf text-white" : "text-soil hover:bg-track"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
