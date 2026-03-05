import { Link } from "react-router-dom";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { loadSettings } from "@/lib/settings";

const Footer = () => {
    const { openPreferences } = useCookieConsent();
    const settings = loadSettings();
    const whatsappNumber = settings.store.storePhone.replace(/\D/g, "");
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";
    const socialLinks = [
      { label: "Instagram", href: "https://www.instagram.com/dezora_luxe" },
      { label: "TikTok", href: "https://www.tiktok.com/@dezora_luxe" },
      { label: "Facebook", href: "https://www.facebook.com/dezora_luxe" },
    ];
    
    const footerLinks = {
      Shop: ["New Arrivals", "Best Sellers", "Collections", "Sale"],
      Help: ["FAQ", "Shipping", "Returns", "Contact"],
      Company: ["About Us", "Careers", "Press Releases"],
      Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Cookie Preferences"],
    };

    const getLinkPath = (category: string, link: string): string => {
      if (category === "Shop") {
        if (link === "New Arrivals") return "/new-arrivals";
        if (link === "Best Sellers") return "/best-sellers";
        if (link === "Collections") return "/collections";
        if (link === "Sale") return "/sale";
      }
      if (category === "Help") {
        if (link === "FAQ") return "/faq";
        if (link === "Shipping") return "/shipping";
        if (link === "Returns") return "/returns";
        if (link === "Contact") return "/contact";
      }
      if (category === "Company") {
        if (link === "About Us") return "/about";
        if (link === "Careers") return "/careers";
        if (link === "Press Releases") return "/press-releases";
      }
      if (category === "Legal") {
        if (link === "Privacy Policy") return "/privacy-policy";
        if (link === "Terms of Service") return "/terms-of-service";
        if (link === "Cookie Policy") return "/cookies-policy";
        if (link === "Cookie Preferences") return "#"; // Special case - handled by onClick
      }
      return "#";
    };

    const handleLinkClick = (category: string, link: string, e: React.MouseEvent<HTMLAnchorElement>) => {
      if (category === "Legal" && link === "Cookie Preferences") {
        e.preventDefault();
        openPreferences();
      }
    };
  
    return (
      <footer className="bg-background border-t border-border">
        <div className="container mx-auto px-6">
          {/* Main Footer */}
          <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <a href="/" className="inline-flex items-center">
                <img
                  src="/images/DLX.png"
                  alt="Dezora Luxe"
                  className="h-10 w-auto object-contain"
                />
              </a>
              <p className="text-sm text-muted-foreground">
                Premium essentials for the modern individual.
              </p>
              
            </div>
            
            {/* Links */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-medium text-foreground mb-4">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => {
                    const path = getLinkPath(title, link);
                    const isCookiePreferences = title === "Legal" && link === "Cookie Preferences";
                    return (
                      <li key={link}>
                        <Link
                          to={path}
                          onClick={(e) => handleLinkClick(title, link, e)}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div className="pb-6 flex items-center justify-center md:justify-end">
            <div className="flex flex-wrap items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-gold transition-colors"
                >
                  {social.label}
                </a>
              ))}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-wider text-muted-foreground hover:text-gold transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="py-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 DEZORA LUXE. All rights reserved.</p>
           
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  