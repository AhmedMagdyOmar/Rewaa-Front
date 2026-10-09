import Link from "next/link";
import { Logo, LogoProps } from "./logo";

/**
 * Represents a column of links in the footer.
 */
export interface FooterColumn {
  /** The title of the column */
  title: string;
  /** An array of links to display in this column */
  links: { label: string; href: string }[];
}

/**
 * Props for the Footer component.
 */
interface FooterProps extends LogoProps {
  /** A brief description or tagline displayed under the logo */
  description?: string;
  /** An array of link columns to display in the footer */
  columns?: FooterColumn[];
  /** An array of social media links with icons */
  socialLinks?: { label: string; href: string; iconSvg: string }[];
  /** An array of links for the bottom bar (e.g., Privacy Policy, Terms of Service) */
  bottomLinks?: { label: string; href: string; iconSvg?: string }[];
  /**
   * The name of your brand for the copyright notice and logo.
   */
  brandName?: string;
}

/**
 * A structural footer component with branding, descriptive text, and dynamic link columns.
 *
 * @param {FooterProps} props - The component props.
 * @param {string} [props.brandName="Brand"] - The name of your brand for the copyright notice and logo.
 * @param {string} [props.logoImage] - Optional image URL for the brand logo.
 * @param {React.ReactNode} [props.logoSvg] - Optional SVG component for the brand logo.
 * @param {string} [props.description] - A brief description or tagline displayed under the logo.
 * @param {FooterColumn[]} [props.columns=[]] - An array of link columns, each with a title and a list of links.
 * @param {{label: string, href: string, iconSvg: string}[]} [props.socialLinks=[]] - An array of social media links with icons.
 * @param {{label: string, href: string, iconSvg?: string}[]} [props.bottomLinks=[]] - An array of links for the bottom bar.
 *
 * @example
 * ```tsx
 * <Footer
 *   brandName="MyStore"
 *   description="The best store in town."
 *   columns={[{ title: "Shop", links: [{ label: "All Items", to: "/shop" }] }]}
 *   socialLinks={[{ label: "Twitter", href: "https://twitter.com", iconSvg: "<svg>...</svg>" }]}
 *   bottomLinks={[{ label: "Privacy", href: "/privacy" }]}
 * />
 * ```
 */

export function Footer({
  brandName = "Brand",
  logoImage,
  logoSvg,
  description,
  columns = [],
  socialLinks = [],
  bottomLinks = [],
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-4">
              <Logo logoImage={logoImage} logoSvg={logoSvg} />
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={social.label}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
                      dangerouslySetInnerHTML={{ __html: social.iconSvg }}
                    />
                    <span className="sr-only">{social.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Link Columns */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="font-medium text-sm">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground space-y-4 md:space-y-0">
          <p>
            © {currentYear} {brandName}. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            {bottomLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.iconSvg ? (
                  <span
                    className="flex h-5 w-5 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
                    dangerouslySetInnerHTML={{ __html: link.iconSvg }}
                  />
                ) : (
                  link.label
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
