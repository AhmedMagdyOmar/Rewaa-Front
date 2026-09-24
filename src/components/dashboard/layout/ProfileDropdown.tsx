import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/types/auth";
import { LogOut, Settings, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import * as React from "react";
import { getStoredStudents } from "@/lib/students-storage";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ProfileDropdownProps {
  user: UserProfile;
  handleLogout: () => void;
  isPending: boolean;
  expanded?: boolean;
  showRole?: boolean;
  variant?: "light" | "dark";
}

export function ProfileDropdown({
  user,
  handleLogout,
  isPending,
  showRole = false,
  variant = "dark",
}: ProfileDropdownProps) {
  const locale = useLocale();
  const t = useTranslations("nav");

  // Localized user display name
  const isAr = locale === "ar";
  const firstName = isAr && user.firstNameAr ? user.firstNameAr : user.firstName || "";
  const lastName = isAr && user.lastNameAr ? user.lastNameAr : user.lastName || "";
  const fullName =
    user.full_name ||
    (firstName && lastName ? `${firstName} ${lastName}`.trim() : "") ||
    user.email ||
    user.phone ||
    "";

  // Contact info (email or phone)
  const contactInfo = user.email || user.phone || "";

  // Localized role
  const storeRole = useAuthStore((s) => s.role);
  const rawRole = (user.role || (storeRole === "student" ? "student" : "") || "user").toLowerCase();
  const localizedRole =
    isAr && user.roleAr
      ? user.roleAr
      : t.has(`roles.${rawRole}`)
        ? t(`roles.${rawRole}`)
        : user.role || t("roles.user");

  const isLight = variant === "light";
  const isStudent = rawRole === "student";
  const profileHref = isStudent ? "/student-dashboard/profile" : "/dashboard/profile";
  const settingsHref = isStudent ? "/student-dashboard/settings" : "/dashboard/settings";

  // If student, check for active student avatar from local storage
  const [studentAvatar, setStudentAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isStudent) {
      const syncStudentAvatar = () => {
        const students = getStoredStudents(locale);
        const active = students[0];
        if (active?.image) {
          setStudentAvatar(active.image);
        }
      };
      syncStudentAvatar();
      window.addEventListener("rewaa_students_updated", syncStudentAvatar);
      return () => {
        window.removeEventListener("rewaa_students_updated", syncStudentAvatar);
      };
    }
  }, [isStudent, locale]);

  const effectiveAvatar = isStudent && studentAvatar ? studentAvatar : user.avatarUrl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className={cn(
            "relative flex items-center transition-all cursor-pointer rounded-lg w-full p-3 justify-start gap-3 group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:hover:bg-transparent!",
            isLight && "hover:bg-muted text-foreground",
            !isLight && "hover:bg-primary text-white",
          )}
        >
          <div className="flex flex-col text-start overflow-hidden flex-1 group-data-[collapsible=icon]:hidden">
            <p
              className={cn(
                "text-sm font-semibold leading-none truncate",
                isLight ? "text-foreground" : "text-white",
              )}
            >
              {fullName}
            </p>
            <p
              className={cn(
                "text-xs leading-none truncate mt-1",
                isLight ? "text-muted-foreground" : "text-white/70",
              )}
            >
              {showRole ? localizedRole : contactInfo}
            </p>
          </div>
          <div
            className={cn(
              "relative flex size-8 group-data-[collapsible=icon]:size-10 shrink-0 items-center justify-center rounded-full border overflow-hidden transition-colors",
              isLight
                ? "bg-muted border-border text-foreground"
                : "bg-white/10 border-white/20 text-white",
            )}
          >
            {effectiveAvatar ? (
              <Image
                src={effectiveAvatar}
                alt={fullName}
                fill
                sizes="40px"
                className="object-cover"
                unoptimized
              />
            ) : firstName && lastName ? (
              <span className="text-xs font-bold uppercase">
                {firstName.charAt(0) + lastName.charAt(0)}
              </span>
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            {contactInfo && (
              <p className="text-xs leading-none text-muted-foreground">{contactInfo}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileHref} className="cursor-pointer flex items-center">
            <User className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            <span>{t("profile")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={settingsHref} className="cursor-pointer flex items-center">
            <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            <span>{t("settings")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer flex items-center"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          <span>{isPending ? t("loggingOut") : t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
