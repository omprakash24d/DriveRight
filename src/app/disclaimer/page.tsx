
import { getSiteSettings } from "@/services/settingsService";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Disclaimer for Driving School Arwal. Information on affiliate links, health-related content, advertisements, and more.',
};


export default async function DisclaimerPage() {
    const settings = await getSiteSettings();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    return (
        <div className="container mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-16">
            <article className="space-y-4 text-foreground">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Disclaimer</h1>
                <p className="text-muted-foreground">Last updated: July 08, 2025</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Interpretation and Definitions</h2>
                <h3 className="text-2xl font-semibold tracking-tight mt-6">Interpretation</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
                <h3 className="text-2xl font-semibold tracking-tight mt-6">Definitions</h3>
                <p className="leading-7 [&:not(:first-child)]:mt-6">For the purposes of this Disclaimer:</p>
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                    <li><strong>Company</strong> (referred to as either &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Disclaimer) refers to {settings.schoolName}, {settings.address}.</li>
                    <li><strong>Service</strong> refers to the Website.</li>
                    <li><strong>You</strong> means the individual accessing the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                    <li><strong>Website</strong> refers to {settings.schoolName}, accessible from <a href={appUrl} rel="external nofollow noopener" target="_blank" className="font-medium text-primary underline underline-offset-4">{appUrl}</a></li>
                </ul>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">General Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The information contained on the Service is for general information purposes only.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Company assumes no responsibility for errors or omissions in the contents of the Service.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">In no event shall the Company be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service. The Company reserves the right to make additions, deletions, or modifications to the contents on the Service at any time without prior notice.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Company does not warrant that the Service is free of viruses or other harmful components.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Affiliate Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">This affiliate disclosure details the affiliate relationships of the Company with other companies and products. Some of the links on this site are &quot;affiliate links&quot;, which means if you click on the link and purchase the item, the Company will receive an affiliate commission. This is a legitimate way to monetize and pay for the operation of the Service, and We will gladly reveal our affiliate relationships to you.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Fitness and Medical Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Service may offer health, fitness and nutritional information and is designed for educational purposes only. You should not rely on this information as a substitute for, nor does it replace, professional medical advice, diagnosis, or treatment. If you have any concerns or questions about your health, you should always consult with a physician or other health-care professional. Do not disregard, avoid or delay obtaining medical or health related advice from your health-care professional because of something you may have read on the Service.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Advertisements Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Third-party advertisements and links to third-party websites may be displayed on the Service. The Company does not make any representation as to the accuracy or suitability of any of the information contained in those advertisements or websites and does not accept any responsibility or liability for the conduct or content of those advertisements and websites and the offerings made by the third-parties.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Testimonials and Reviews Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Service may contain testimonials or reviews by users of our products and/or services. These testimonials reflect the real-life experiences and opinions of such users. In some instances, we may have provided compensation, such as a free product or a reduced price, in exchange for an honest review. All opinions expressed are our own. We do not claim, and you should not assume, that all users will have the same experiences.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">External Links Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Service may contain links to external websites that are not provided or maintained by or in any way affiliated with the Company.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Please note that the Company does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.</p>

                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Errors and Omissions Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The information given by the Service is for general guidance on matters of interest only. Even if the Company takes every precaution to ensure that the content of the Service is both current and accurate, errors can occur. Plus, given the changing nature of laws, rules and regulations, there may be delays, omissions or inaccuracies in the information contained on the Service.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Company is not responsible for any errors or omissions, or for the results obtained from the use of this information.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Fair Use Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Company may use copyrighted material which has not always been specifically authorized by the copyright owner. The Company is making such material available for criticism, comment, news reporting, teaching, scholarship, or research.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Company believes this constitutes a &quot;fair use&quot; of any such copyrighted material as provided for in section 107 of the United States Copyright law.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">If You wish to use copyrighted material from the Service for your own purposes that go beyond fair use, You must obtain permission from the copyright owner.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Views Expressed Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Service may contain views and opinions which are those of the authors and do not necessarily reflect the official policy or position of any other author, agency, organization, employer or company, including the Company.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">Comments published by users are their sole responsibility and the users will take full responsibility, liability and blame for any libel or litigation that results from something written in or as a direct result of something written in a comment. The Company is not liable for any comment published by users and reserves the right to delete any comment for any reason whatsoever.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">No Responsibility Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The information on the Service is provided with the understanding that the Company is not herein engaged in rendering legal, accounting, tax, or other professional advice and services. As such, it should not be used as a substitute for consultation with professional accounting, tax, legal or other competent advisers.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">In no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever arising out of or in connection with your access or use or inability to access or use the Service.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">&quot;Use at Your Own Risk&quot; Disclaimer</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">All information in the Service is provided &quot;as is&quot;, with no guarantee of completeness, accuracy, timeliness or of the results obtained from the use of this information, and without warranty of any kind, express or implied, including, but not limited to warranties of performance, merchantability and fitness for a particular purpose.</p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">The Company will not be liable to You or anyone else for any decision made or action taken in reliance on the information given by the Service or for any consequential, special or similar damages, even if advised of the possibility of such damages.</p>
                
                <h2 className="text-3xl font-semibold tracking-tight border-b pb-2 mt-10">Contact Us</h2>
                <p className="leading-7 [&:not(:first-child)]:mt-6">If you have any questions about this Disclaimer, You can contact Us:</p>
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                    <li>By email: <a href={`mailto:${settings.contactEmail}`} className="font-medium text-primary underline underline-offset-4">{settings.contactEmail}</a></li>
                    <li>By visiting this page on our website: <a href="/contact" rel="external nofollow noopener" target="_blank" className="font-medium text-primary underline underline-offset-4">/contact</a></li>
                    <li>By phone number: {settings.phone}</li>
                    <li>By mail: {settings.address}</li>
                </ul>
            </article>
        </div>
    );
}
