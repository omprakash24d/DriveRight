
"use client";

import { Header } from "@/components/Header";
import type { SiteSettings } from "@/services/settingsService";

interface HeaderWrapperProps {
  settings: SiteSettings;
}

// This wrapper ensures that the Header component, which uses client-side hooks,
// receives the server-fetched settings as a prop. This resolves hydration errors
// related to accessing environment variables on the client too early.
export function HeaderWrapper({ settings }: HeaderWrapperProps) {
  return <Header settings={settings} />;
}
