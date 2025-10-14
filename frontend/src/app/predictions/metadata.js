// frontend/src/app/predictions/metadata.js
export const metadata = {
  title: "NFL Predictions by Week & Season",
  description: "Browse comprehensive NFL predictions by season and week. Filter by confidence level and sort by date, probability, or confidence. Updated continuously with latest data.",
  keywords: ["NFL predictions by week", "NFL weekly picks", "season predictions", "NFL schedule predictions", "football game predictions"],
  openGraph: {
    title: "NFL Predictions by Week & Season | StatMind Sports",
    description: "Browse NFL predictions by season and week with advanced filtering and sorting options.",
    url: "https://statmindsports.com/predictions",
    type: "website",
    images: [
      {
        url: "/og-predictions.jpg",
        width: 1200,
        height: 630,
        alt: "StatMind Sports Predictions Page",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NFL Predictions by Week & Season",
    description: "Browse NFL predictions with advanced filtering. Updated continuously.",
    images: ["/twitter-predictions.jpg"],
  },
};