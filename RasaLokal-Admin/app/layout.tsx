import type { Metadata } from "next";
import "./globals.css";
import "./actions.css";
import "./picker.css";

export const metadata: Metadata = {
  title: { default: "RasaLokal Command Center", template: "%s · RasaLokal" },
  description: "Pusat kendali operasional marketplace RasaLokal"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
