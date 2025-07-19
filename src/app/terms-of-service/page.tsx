
import { getSiteSettings } from "@/services/settingsService";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions for using our services and website.',
};

export default async function TermsOfServicePage() {
    const settings = await getSiteSettings();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    return (
        <div className="container mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-16">
            <article className="space-y-4 text-foreground">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Terms and Conditions</h1>
                <p className="text-muted-foreground">Last updated: July 08, 2025</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Please read these terms and conditions carefully before using Our Service.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Interpretation and Definitions</h2>
                <h3 className="text-2xl font-semibold tracking-tight mt-6">Interpretation</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
                <h3 className="text-2xl font-semibold tracking-tight mt-6">Definitions</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">For the purposes of these Terms and Conditions:</p>
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                    <li><strong>Company</strong> (referred to as either &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement) refers to {settings.schoolName}, {settings.address}.</li>
                    <li><strong>Country</strong> refers to: Bihar,  India</li>
                    <li><strong>Service</strong> refers to the Website.</li>
                    <li><strong>Terms and Conditions</strong> (also referred as &quot;Terms&quot;) mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</li>
                    <li><strong>Website</strong> refers to {settings.schoolName}, accessible from <a href={appUrl} rel="external nofollow noopener" target="_blank" className="font-medium text-primary underline underline-offset-4">{appUrl}</a></li>
                    <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                </ul>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Acknowledgment</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">User Accounts</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">User Content</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Our Service allows You to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (&quot;Content&quot;). You are responsible for the Content that You post to the Service, including its legality, reliability, and appropriateness.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">By posting Content to the Service, You grant Us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of Your rights to any Content You submit, post or display on or through the Service and You are responsible for protecting those rights. You agree that this license includes the right for Us to make Your Content available to other users of the Service, who may also use Your Content subject to these Terms.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Intellectual Property</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Service and its original content (excluding Content provided by You or other users), features and functionality are and will remain the exclusive property of the Company and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of the Company.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Your Feedback to Us</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">You assign all rights, title and interest in any feedback, suggestions, ideas or other information or materials You provide to us concerning the Service (&quot;Feedback&quot;). You agree that the Company may use, disclose, reproduce, license or otherwise distribute and exploit such Feedback as it sees fit, entirely without obligation or restriction of any kind on account of intellectual property rights or otherwise.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Links to Other Websites</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Our Service may contain links to third-party web sites or services that are not owned or controlled by the Company. The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. We strongly advise You to read the terms and conditions and privacy policies of any third-party web sites or services that You visit.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Termination</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">We may terminate or suspend Your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions. Upon termination, Your right to use the Service will cease immediately.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Limitation of Liability</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">&quot;AS IS&quot; and &quot;AS AVAILABLE&quot; Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Service is provided to You &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Governing Law</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Disputes Resolution</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Changes to These Terms and Conditions</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Contact Us</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">If you have any questions about these Terms and Conditions, You can contact us:</p>
                 <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                    <li>By email: <a href={`mailto:${settings.contactEmail}`} className="font-medium text-primary underline underline-offset-4">{settings.contactEmail}</a></li>
                    <li>By visiting this page on our website: <a href="/contact" rel="external nofollow noopener" target="_blank" className="font-medium text-primary underline underline-offset-4">Contact Us</a></li>
                    <li>By phone number: {settings.phone}</li>
                    <li>By mail: {settings.address}</li>
                </ul>
            </article>
        </div>
    );
}
