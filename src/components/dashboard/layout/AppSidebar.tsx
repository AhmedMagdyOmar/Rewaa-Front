"use client";
import { Logo } from "@/components/landing/layout/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  useProviderProfile,
  useProviderLogout,
  useStudentProfile,
  useStudentLogout,
} from "@/hooks/use-auth-queries";
import { useAuthStore } from "@/lib/stores/auth-store";
import { UserProfile } from "@/types/auth";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { ProfileDropdown } from "./ProfileDropdown";
import { navConfig, studentNavConfig } from "@/config/nav-config";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { PanelLeftIcon } from "lucide-react";

export function AppSidebar({
  initialProfileData,
  side: sideProp,
  variant = "admin",
}: {
  initialProfileData?: UserProfile | null;
  side?: "left" | "right";
  variant?: "admin" | "student";
}) {
  const currentNavConfig = variant === "student" ? studentNavConfig : navConfig;
  const navItems = currentNavConfig.sidebarNav;
  const primaryLink = currentNavConfig.primaryLink;
  const locale = useLocale();
  const side = sideProp ?? (locale === "ar" ? "right" : "left");
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  // Role-aware profile & logout hooks
  const isStudent = variant === "student";

  const providerProfileQuery = useProviderProfile({ enabled: !isStudent });
  const studentProfileQuery = useStudentProfile({ enabled: isStudent });
  const { mutate: providerLogout, isPending: isProviderLogoutPending } = useProviderLogout();
  const { mutate: studentLogout, isPending: isStudentLogoutPending } = useStudentLogout();

  const profileQuery = isStudent ? studentProfileQuery : providerProfileQuery;
  const isLoading = profileQuery.status === "pending";
  const error = profileQuery.error;
  const isPending = isStudent ? isStudentLogoutPending : isProviderLogoutPending;

  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  // Zustand store user for immediate display on mount/rehydration
  const storeUser = useAuthStore((s) => s.user);

  // Normalise profile data from query or fall back to Zustand store
  const queryUser = profileQuery.data;
  const resolvedFullName =
    ((queryUser as Record<string, unknown>)?.full_name as string | undefined) ??
    storeUser?.full_name ??
    "";

  // Build user profile shape for ProfileDropdown
  const user: UserProfile | null =
    queryUser != null
      ? (queryUser as unknown as UserProfile)
      : storeUser
        ? {
            id: storeUser.id,
            email: storeUser.email,
            firstName: resolvedFullName.split(" ")[0] ?? "",
            lastName: resolvedFullName.split(" ").slice(1).join(" ") ?? "",
            full_name: storeUser.full_name,
            role: storeUser.role === "student" ? "student" : "assistant",
            isVerified: true,
          }
        : (initialProfileData ?? null);

  const handleLogout = () => {
    if (isStudent) {
      studentLogout(undefined, {
        onSuccess: () => {
          router.push("/auth/login");
          router.refresh();
        },
      });
    } else {
      providerLogout(undefined, {
        onSuccess: () => {
          router.push("/auth/login");
          router.refresh();
        },
      });
    }
  };

  // Helper to translate nav item label
  const getNavLabel = (label: string) => {
    if (t.has(label)) return t(label);
    const key = label.toLowerCase();
    return t.has(key) ? t(key) : label;
  };

  return (
    <Sidebar collapsible="icon" side={side}>
      <SidebarHeader className="h-16 flex items-center justify-center px-3 py-3 border-b border-sidebar-border/50">
        <button
          onClick={toggleSidebar}
          title={t("expandSidebar")}
          className="hidden group-data-[collapsible=icon]:flex group/logo-trigger size-12 shrink-0 aspect-square p-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
        >
          <div className="group-hover/logo-trigger:hidden flex items-center justify-center transition-transform duration-200">
            <Logo logoOnly width={20} height={20} />
          </div>
          <PanelLeftIcon className="hidden group-hover/logo-trigger:inline-flex size-5 rtl:rotate-180 text-white" />
        </button>
        <div className="flex w-full items-center justify-between group-data-[collapsible=icon]:hidden">
          <Link
            href={primaryLink.href}
            className="flex items-center text-white text-start overflow-hidden rounded-md p-2"
          >
            <Logo brandName={tCommon("brandName")} width={20} height={20} />
          </Link>
          <SidebarTrigger className="hover:bg-white/10 text-white rounded-full size-8 [&_svg]:size-5" />
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-y-1">
        <SidebarGroup>
          <SidebarMenu className="space-y-2 flex flex-col items-center">
            {navItems.map((item) => {
              const translatedLabel = getNavLabel(item.label);
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href} className="w-full flex justify-center">
                  <SidebarMenuButton
                    asChild
                    tooltip={translatedLabel}
                    isActive={isActive}
                    className={cn(
                      "flex items-center rounded-full transition-colors w-full gap-4 px-4 py-6 justify-start group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center",
                      isActive
                        ? "bg-primary! hover:bg-primary! text-white"
                        : "text-inactive-gray hover:bg-primary hover:text-white",
                    )}
                  >
                    <Link href={item.href} className="flex items-center justify-center">
                      <item.icon className="size-5 shrink-0 text-current transition-colors" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {translatedLabel}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 py-4">
        <SidebarMenu className="flex flex-col items-center">
          <SidebarMenuItem className="w-full flex justify-center">
            {isLoading && <div>Loading...</div>}
            {error && <div>Error: {error.message}</div>}
            {user && (
              <ProfileDropdown
                user={user}
                handleLogout={handleLogout}
                isPending={isPending}
                expanded={!isCollapsed}
              />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
