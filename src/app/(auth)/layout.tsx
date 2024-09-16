// app/(application)/layout.tsx

import SiteFooter from "@/components/site-footer";
import { PropsWithChildren } from "react";

export default function ApplicationLayout({ children }: PropsWithChildren) {
  return (
    <div>
      {/* Add your application-specific layout components */}
      <main className="min-h-[100dvh] grid grid-rows-[auto_1fr_auto]">
        <nav>{/* <SiteHeader /> */}</nav>
        {children}

        <footer>
          <SiteFooter />
        </footer>
      </main>
    </div>
  );
}
