import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">Adverix AI</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Pricing
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              FAQ
            </a>
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Terms of Service
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-muted-foreground text-sm">
            © 2025 Adverix AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
