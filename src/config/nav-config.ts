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
      label: "Courses",
      href: "/student-dashboard/courses",
      icon: BookOpen,
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
      label: "Billing",
      href: "/student-dashboard/billing",
      icon: CreditCard,
    },
  ],
};

export const studentNavbarLinks = [
  { label: "Home", href: "/student-dashboard" },
  { label: "Courses", href: "/student-dashboard/courses" },
  { label: "generalLessons", href: "/student-dashboard/lessons" },
  { label: "Exams", href: "/student-dashboard/exams" },
];
