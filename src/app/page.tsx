import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import AITranscriber from "@/components/ai-transcriber";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto min-h-[100dvh] grid grid-rows-[auto_1fr_auto]">
      <nav>
        <SiteHeader />
      </nav>
      <div className="mx-4">
        <AITranscriber />
      </div>
      <SiteFooter />
    </main>
  );
}
