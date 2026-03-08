import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "My Easy Share",
  description: "Share everthing to your TV/devices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}