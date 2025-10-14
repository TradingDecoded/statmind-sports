// frontend/src/app/diagnostic/layout.js
export const metadata = {
  title: "System Diagnostics",
  description: "StatMind Sports system health and API diagnostics.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiagnosticLayout({ children }) {
  return children;
}