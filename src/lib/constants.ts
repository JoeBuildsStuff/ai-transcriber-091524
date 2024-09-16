import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI News on the Cheep",
  description:
    "Stay informed with our AI-curated newsletter, delivering the latest insights and applications of artificial intelligence across various industries.",
  keywords: [
    "AI newsletter",
    "artificial intelligence news",
    "applied AI",
    "tech innovations",
    "AI applications",
  ],
  authors: [{ name: "AI News on the Cheep Team" }],
  openGraph: {
    title: "AI News on the Cheep: Your Source for AI Innovations",
    description:
      "Discover how AI is transforming industries with our curated newsletter. Get the latest insights on applied artificial intelligence.",
    url: "https://newsappliedai.com",
    siteName: "AI News on the Cheep",
    images: [
      {
        url: "https://newsappliedai.com/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "AI News on the Cheep Newsletter Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI News on the Cheep: AI Innovations at Your Fingertips",
    description:
      "Stay ahead of the curve with our AI-powered newsletter, bringing you the latest in applied artificial intelligence.",
    creator: "@newsappliedai",
    images: ["https://newsappliedai.com/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    // apple: '/apple-touch-icon.png',
  },
  //   verification: {
  //     google: 'your-google-site-verification-code',
  //     yandex: 'your-yandex-verification-code',
  //     bing: 'your-bing-verification-code',
  //   },
  other: {
    "application-name": "AI News on the Cheep",
  },
};
