"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo, LogoProps } from "./logo";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

// 1. Define the data structure for your navigation
/**
 * Represents a single navigation route.
 */
interface NavRoute {
  /** The target URL for the link */
  href: string;
  /** The text label to display for the link */
  label: string;
}

/**
 * Props for the Navbar component.
 */
interface NavbarProps extends LogoProps {
  /** An array of navigation links to display in the menu */
  routes: NavRoute[];
  /** Optional slot for additional components like buttons or user profile dropdowns */
  actionSlot?: React.ReactNode;
}

/**
 * A responsive navigation bar component that supports branding, dynamic routes, and an action slot.
 *
 * @param {NavbarProps} props - The component props.
 * @param {string} [props.logoImage] - Optional image URL for the brand logo.
 * @param {React.ReactNode} [props.logoSvg] - Optional SVG component for the brand logo.
 * @param {NavRoute[]} props.routes - An array of navigation links with 'to' and 'label' properties.
 * @param {React.ReactNode} [props.actionSlot] - Optional slot for additional components like buttons or user profile dropdowns.
 *
 * @example
 * ```tsx
 * <Navbar
 *   brandName="MyStore"
 *   routes={[{ to: "/products", label: "Products" }]}
 *   actionSlot={<Button>Login</Button>}
 * />
 * ```
 */

export function Navbar({ logoImage, logoSvg, routes, actionSlot }: NavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-foreground/10 bg-background/90 backdrop-blur-md shadow-lg shadow-background/30"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center">
          <Logo
            logoImage={logoImage}
            logoSvg={logoSvg}
            className="transition-colors duration-300 text-foreground"
          />
        </Link>

        {/* Desktop Navigation (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`transition-all duration-300 relative py-1 text-sm ${
                  isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {route.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full shadow-[0_0_8px_rgba(49,216,203,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action Slot (e.g., Login Button) */}
        <div className="hidden md:flex items-center space-x-4">{actionSlot}</div>

        {/* Mobile Navigation (Hidden on Desktop) */}
        <div className="flex md:hidden items-center space-x-2">
          {actionSlot}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground hover:bg-foreground/10! hover:text-foreground transition-colors duration-300"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 max-w-[85vw] p-6 bg-background/95 text-foreground border-l border-foreground/10 backdrop-blur-md"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mb-8">
                <Logo logoImage={logoImage} logoSvg={logoSvg} className="text-foreground" />
              </div>

              <SheetDescription className="sr-only">Links to navigate the site.</SheetDescription>
              <nav className="flex flex-col space-y-4 mt-8">
                {routes.map((route) => {
                  const isActive = pathname === route.href;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setIsOpen(false)} // Close menu on click
                      className={`text-lg font-medium transition-colors ${
                        isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      {route.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
