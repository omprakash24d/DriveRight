
import { templates } from '@/emails/templates';

/**
 * Reads an HTML email template from the imported templates module.
 * @param templateName - The name of the template file (without .html extension).
 * @returns The content of the HTML file as a string.
 */
export function getEmailTemplate(templateName: keyof typeof templates): string {
    const template = templates[templateName];

    if (!template) {
        console.error(`Error finding email template: ${templateName}`);
        // Fallback to a very basic template if one is missing, to prevent crashes.
        return `
        <html>
            <body>
                <h1>Error</h1>
                <p>Could not load email template: ${templateName}. Please check server logs.</p>
            </body>
        </html>`;
    }
    return template;
}
