"use client";
import { Calendar, Home, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dict } from "@/lib/i18n/dictionaries";

export function NavBar({
  activeClanId,
  navDict,
}: {
  activeClanId: string | null
  navDict: Dict['nav']
}) {
  const pathname = usePathname();

  const homeHref = activeClanId ? `/clan/${activeClanId}` : "/dashboard";

  const links = [
    { href: homeHref, icon: Home, label: navDict.home },
    { href: "/matches", icon: Calendar, label: navDict.matches },
    { href: "/ranking", icon: Trophy, label: navDict.ranking },
    { href: "/profile", icon: User, label: navDict.profile },
  ];

  const isActive = (href: string) => {
    if (href === homeHref) {
      return pathname === "/dashboard" || pathname.startsWith("/clan");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile: bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around bg-blue-900/90 backdrop-blur-md border-t border-white/10"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          height: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-colors ${
              isActive(href)
                ? "text-emerald-400"
                : "text-blue-400 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex flex-col items-center gap-1 fixed left-0 top-14 bottom-0 w-20 z-30 bg-blue-900/60 backdrop-blur-sm border-r border-white/10 py-4">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-colors ${
              isActive(href)
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-blue-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}
      </aside>
    </>
  );
}
