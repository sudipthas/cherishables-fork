import { Link } from "@tanstack/react-router";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { to: "/order-gift", label: "Order a Gift" },
    { to: "/order-3d-model", label: "Order 3D Model" },
    { to: "/return-policy", label: "Returns" },
    { to: "/privacy", label: "Policy" },
  ];

  return (
    <footer className="w-full bg-muted/40 border-t" data-ocid="footer">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-muted-foreground hover:text-accent transition-smooth"
              data-ocid={`footer.${link.label.toLowerCase().replace(/\s+/g, "_")}.link`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            &copy; {currentYear}. Built with love using{" "}
            <a
              href="https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=cherishables"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-accent transition-smooth"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
