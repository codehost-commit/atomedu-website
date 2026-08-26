import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atom Edu, a free workbench for teachers",
  description:
    "Draft assignments, assessments, and feedback, then approve. Free forever for every teacher.",
  icons: {
    icon: "/atom-mark.svg",
    shortcut: "/atom-mark.svg",
    apple: "/atom-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
