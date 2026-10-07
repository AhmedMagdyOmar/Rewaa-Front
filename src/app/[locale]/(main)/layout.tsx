import "@/app/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/query-provider";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "300", "200", "100"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: process.env.NEXT_PUBLIC_API_URL,
    title: "Rewaa",
    description: "Rewaa Educational Platform",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Root layout component for the main application group with [locale] routing.
 */
export default async function MainLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${ibmPlexArabic.variable} ${ibmPlexArabic.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Rewaa" />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster
                position="top-right"
                duration={4000}
                richColors={false}
                toastOptions={{
                  classNames: {
                    toast: "font-sans border shadow-lg text-sm rounded-xl overflow-hidden relative",
                    success:
                      "toast-success !bg-success !text-white !border-success/20 [&_[data-title]]:!text-white [&_[data-description]]:!text-white/90 [&_[data-icon]]:!text-white",
                    error:
                      "toast-error !bg-error !text-white !border-error/20 [&_[data-title]]:!text-white [&_[data-description]]:!text-white/90 [&_[data-icon]]:!text-white",
                  },
                }}
              />
            </TooltipProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
