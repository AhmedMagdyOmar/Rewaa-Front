import {
  LayoutDashboard,
  Video,
  BookOpen,
  Users,
  CreditCard,
  FileQuestion,
  HelpCircle,
  LucideIcon,
  Compass,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import { getWhatsAppUrl } from "@/components/ui/phone-link";

export const SUPPORT_WHATSAPP_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "+201009876543";
export const SUPPORT_WHATSAPP_URL = getWhatsAppUrl(SUPPORT_WHATSAPP_PHONE);

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isExternal?: boolean;
}

export interface NavConfig {
  primaryLink: {
    label: string;
    href: string;
  };
  sidebarNav: NavItem[];
}

export const navConfig: NavConfig = {
  primaryLink: {
    label: "Dashboard",
    href: "/dashboard",
  },
  sidebarNav: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      label: "Lessons",
      href: "/dashboard/lessons",
      icon: Video,
    },
    {
      label: "Exams",
      href: "/dashboard/exams",
      icon: FileQuestion,
    },
    {
      label: "Questions",
      href: "/dashboard/questions",
      icon: HelpCircle,
    },
    {
      label: "Students",
      href: "/dashboard/students",
      icon: Users,
    },
    {
      label: "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      label: "contactUs",
      href: SUPPORT_WHATSAPP_URL,
      icon: MessageCircle,
      isExternal: true,
    },
  ],
};

export const studentNavConfig: NavConfig = {
  primaryLink: {
    label: "Home",
    href: "/student-dashboard",
  },
  sidebarNav: [
    {
      label: "Home",
      href: "/student-dashboard",
      icon: LayoutDashboard,
    },

    {
      label: "myCourses",
      href: "/student-dashboard/courses",
      icon: BookOpen,
    },
    {
      label: "exploreCourses",
      href: "/student-dashboard/courses/explore",
      icon: Compass,
    },
    {
      label: "Exams",
      href: "/student-dashboard/exams",
      icon: FileQuestion,
    },
    {
      label: "wallet",
      href: "/student-dashboard/wallet",
      icon: CreditCard,
    },
    {
      label: "orders",
      href: "/student-dashboard/orders",
      icon: ShoppingBag,
    },
    {
      label: "contactUs",
      href: SUPPORT_WHATSAPP_URL,
      icon: MessageCircle,
      isExternal: true,
    },
  ],
};

export const studentNavbarLinks = [
  { label: "Home", href: "/student-dashboard" },
  { label: "myCourses", href: "/student-dashboard/courses" },
  { label: "exploreCourses", href: "/student-dashboard/courses/explore" },
  { label: "Exams", href: "/student-dashboard/exams" },
  { label: "wallet", href: "/student-dashboard/wallet" },
  { label: "orders", href: "/student-dashboard/orders" },
  { label: "contactUs", href: SUPPORT_WHATSAPP_URL, isExternal: true },
];
