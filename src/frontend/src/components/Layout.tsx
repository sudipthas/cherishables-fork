import { CartDrawer } from "@/components/CartDrawer";
import { ArtworkDownloadProvider } from "@/context/ArtworkDownloadContext";
import { Outlet } from "@tanstack/react-router";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

function SocialBubbles() {
  return (
    <div
      className="fixed right-4 bottom-8 z-50 flex flex-col gap-3"
      aria-label="Social media links"
    >
      {/* WhatsApp */}
      <a
        href="https://wa.me/918431274009"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        data-ocid="social.whatsapp_button"
        className="group flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
        style={{ background: "#25D366" }}
      >
        <span className="sr-only">Chat on WhatsApp</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-8 h-8"
          fill="white"
          aria-hidden="true"
        >
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.83 6.512L4 29l7.697-1.802A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm5.892 16.687c-.248.697-1.458 1.37-2.01 1.424-.52.05-1.013.245-3.42-.713-2.9-1.144-4.76-4.09-4.906-4.28-.148-.19-1.19-1.585-1.19-3.022 0-1.438.753-2.146 1.02-2.44.269-.295.586-.369.781-.369.195 0 .39.002.56.01.18.01.423-.068.66.504.248.6.844 2.072.918 2.22.073.148.122.322.024.516-.098.195-.146.316-.294.487-.147.171-.31.382-.441.513-.148.147-.302.307-.13.604.172.296.765 1.262 1.642 2.044 1.128 1.005 2.08 1.317 2.376 1.465.296.148.468.123.64-.074.172-.196.734-.856.93-1.151.196-.296.39-.247.66-.148.268.098 1.708.806 2.003.953.294.148.49.222.563.345.073.123.073.71-.175 1.407z" />
        </svg>
      </a>

      {/* Instagram */}
      <a
        href="https://www.instagram.com/direct/t/17844936651669993"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow on Instagram"
        data-ocid="social.instagram_button"
        className="group flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
        style={{
          background:
            "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
        }}
      >
        <span className="sr-only">Follow on Instagram</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill="white"
          aria-hidden="true"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      </a>
    </div>
  );
}

export function Layout() {
  return (
    <ArtworkDownloadProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <SocialBubbles />
        <CartDrawer />
      </div>
    </ArtworkDownloadProvider>
  );
}
