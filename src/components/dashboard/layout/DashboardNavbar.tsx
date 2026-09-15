"use client";

import { Logo } from "@/components/landing/layout/logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Separator } from "@/components/ui/separator";
import { navConfig } from "@/config/nav-config";
import { useAuthControllerGetProfile, useAuthControllerLogout } from "@/hooks/use-auth";
import { authTokens } from "@/lib/auth-token";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { AuthControllerGetProfile200 } from "@/types/api";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { NotificationsPopover } from "./NotificationsPopover";
import { ProfileDropdown } from "./ProfileDropdown";

export interface NavLinkItem {
  label: string;
  href: string;
}

interface DashboardNavbarProps {
  variant?: "light" | "dark";
  links?: NavLinkItem[];
  initialProfileData?: AuthControllerGetProfile200;
  primaryHref?: string;
  centerContent?: React.ReactNode;
}

const DEFAULT_LINKS: NavLinkItem[] = [
  { label: "courses", href: "/dashboard/courses" },
  { label: "lessons", href: "/dashboard/lessons" },
  { label: "exams", href: "/dashboard/exams" },
  { label: "questions", href: "/dashboard/questions" },
  { label: "students", href: "/dashboard/students" },
];

export function DashboardNavbar({
  variant = "light",
  links = DEFAULT_LINKS,
  initialProfileData,
  primaryHref = navConfig.primaryLink.href,
  centerContent,
}: DashboardNavbarProps = {}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const { data } = useAuthControllerGetProfile({
    query: {
      initialData: initialProfileData,
      staleTime: 1000 * 60 * 5,
    },
  });

  const { mutate: logout, isPending } = useAuthControllerLogout({
    mutation: {
      onSuccess: () => {
        authTokens.clearToken();
        router.push("/auth/login");
        router.refresh();
      },
    },
  });

  const handleLogout = () => {
    logout();
  };

  const user = data?.data;

  const getNavLabel = (label: string) => {
    if (t.has(label)) return t(label);
    const key = label.toLowerCase();
    return t.has(key) ? t(key) : label;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand Logo & Main Nav Links */}
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            href={primaryHref}
            className="flex items-center text-primary hover:text-primary/90 transition-colors"
          >
            <Logo brandName={tCommon("brandName")} brandNameClassName="text-inherit" />
          </Link>
          <Separator className="max-md:hidden h-8 my-auto" orientation="vertical" />

          {/* Navigation Links */}
          {links && links.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 md:gap-2 h-16">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative flex items-center h-full px-3 text-sm font-medium transition-colors border-b-2 hover:border-primary hover:text-primary",
                      isActive
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground",
                    )}
                  >
                    {getNavLabel(link.label)}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center Content (e.g., Search Bar) */}
        {centerContent && <div className="flex items-center mx-2">{centerContent}</div>}

        {/* User Actions & Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <NotificationsPopover />
          <LanguageSwitcher variant={variant} />
          <Separator className="max-md:hidden h-8 my-auto" orientation="vertical" />

          {/* Profile Dropdown (Desktop) */}
          {user && (
            <div className="hidden md:block">
              <ProfileDropdown
                user={user}
                handleLogout={handleLogout}
                isPending={isPending}
                expanded={true}
                showRole={true}
                variant={variant}
              />
            </div>
          )}

          {/* Mobile Hamburger Menu (opens sidebar) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden hover:bg-muted text-foreground"
            aria-label="Toggle Sidebar"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
