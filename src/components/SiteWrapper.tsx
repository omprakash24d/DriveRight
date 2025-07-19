
"use client";

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface SiteWrapperProps {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}

export function SiteWrapper({ children, header, footer }: SiteWrapperProps) {
    const pathname = usePathname();
    const isAdminPage = pathname.startsWith('/admin');

    if (isAdminPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            {header}
            <main className="flex-grow">{children}</main>
            {footer}
        </div>
    );
}
