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

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Returns</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You&apos;ll also need the receipt or proof of purchase.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">To start a return, you can contact us at <a href={`mailto:${settings.contactEmail}`} className="font-medium text-primary underline underline-offset-4">{settings.contactEmail}</a>. Please note that returns will need to be sent to the following address:</p>
                <blockquote className="mt-6 border-l-2 pl-6 italic">{settings.address}</blockquote>
                <p className="leading-7 [&:not(:first-child)]:mt-6">If your return is accepted, we’ll send you a return shipping label, as well as instructions on how and where to send your package. Items sent back to us without first requesting a return will not be accepted. Please note that if your country of residence is not India, shipping your goods may take longer than expected.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">You can always contact us for any return questions at <a href={`mailto:${settings.contactEmail}`} className="font-medium text-primary underline underline-offset-4">{settings.contactEmail}</a>.</p>

                <h3 className="text-2xl font-semibold tracking-tight mt-6">Damages and Issues</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Please inspect your order upon receipt and contact us immediately if the item is defective, damaged, or if you receive the wrong item, so that we may evaluate the issue and make it right.</p>

                <h3 className="text-2xl font-semibold tracking-tight mt-6">Exceptions / Non-returnable Items</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases. Please get in touch if you have questions or concerns about your specific item.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Unfortunately, we cannot accept returns on sale items or gift cards.</p>

                <h3 className="text-2xl font-semibold tracking-tight mt-6">Exchanges</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.</p>

                <h3 className="text-2xl font-semibold tracking-tight mt-6">European Union 3 day cooling off period</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Notwithstanding the above, if merchandise is being shipped into the European Union, you have the right to cancel or return your order within 3 days for any reason and without justification. As above, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You&apos;ll also need the receipt or proof of purchase.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Refunds</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">We will notify you once we&apos;ve received and inspected your return to let you know if the refund was approved or not. If approved, you&apos;ll be automatically refunded on your original payment method within 10 business days. Please remember it can take some time for your bank or credit card company to process and post the refund too.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">If more than 15 business days have passed since we&apos;ve approved your return, please contact us at <a href={`mailto:${settings.contactEmail}`} className="font-medium text-primary underline underline-offset-4">{settings.contactEmail}</a>.</p>
            </article>
        </div>
    );
}
