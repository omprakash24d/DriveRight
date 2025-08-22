import { getSiteSettings } from "@/services/settingsService";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Return and Refund Policy',
    description: 'Information about our return and refund policy for services and products offered by Driving School Arwal.',
};

export default async function ReturnAndRefundPage() {
    const settings = await getSiteSettings();

    return (
        <div className="container mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-16">
            <article className="space-y-4 text-foreground">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Return and Refund Policy</h1>
                <p className="text-muted-foreground">Last updated: July 08, 2025</p>

                <p className="All payments are final, NO Refund/cancellations are Entertained TRADE NAME - OM PRAKASH KUMAR"
            </article>
        </div>
    );
}
