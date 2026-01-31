import "./globals.css";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

export const metadata = {
  title: "ENS Proof of Usage",
  description: "ENS-aware proof of usage demo"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.className}>
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
