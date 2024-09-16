// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { metadata as siteMetadata } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)] bg-background font-sans antialiased",
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
