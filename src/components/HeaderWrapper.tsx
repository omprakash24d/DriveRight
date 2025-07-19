
"use client";

import { Header } from "@/components/Header";
import type { SiteSettings } from "@/services/settingsService";

interface HeaderWrapperProps {
  settings: SiteSettings;
}

export function HeaderWrapper({ settings }: HeaderWrapperProps) {
  return <Header settings={settings} />;
}
