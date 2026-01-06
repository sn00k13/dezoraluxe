const Footer = () => {
    const footerLinks = {
      Shop: ["New Arrivals", "Best Sellers", "Collections", "Sale"],
      Help: ["FAQ", "Shipping", "Returns", "Contact"],
      Company: ["About Us", "Careers", "Press", "Sustainability"],
      Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
    };
  
    return (
      <footer className="bg-charcoal border-t border-border">
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
              
              {/* Social Links */}
              <div className="flex gap-4 pt-4">
                {["Twitter", "Instagram", "LinkedIn"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="text-xs uppercase tracking-wider text-muted-foreground hover:text-gold transition-colors"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Links */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-medium text-foreground mb-4">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
  