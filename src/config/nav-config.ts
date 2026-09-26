import {
  LayoutDashboard,
  Video,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  FileQuestion,
  HelpCircle,
  LucideIcon,
  Compass,
  ShoppingBag,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
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
      label: "generalLessons",
      href: "/student-dashboard/lessons",
      icon: Video,
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
  ],
};

export const studentNavbarLinks = [
  { label: "Home", href: "/student-dashboard" },
  { label: "myCourses", href: "/student-dashboard/courses" },
  { label: "exploreCourses", href: "/student-dashboard/courses/explore" },
  { label: "generalLessons", href: "/student-dashboard/lessons" },
  { label: "Exams", href: "/student-dashboard/exams" },
  { label: "wallet", href: "/student-dashboard/wallet" },
  { label: "orders", href: "/student-dashboard/orders" },
];
