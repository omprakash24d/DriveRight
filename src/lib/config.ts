
function getConfigValue(key: string, required = true): string {
    const value = process.env[key];
    if (required && !value) {
        // This error will be caught by Next.js and will provide a clear message.
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || "";
}

export const schoolConfig = {
    name: getConfigValue('NEXT_PUBLIC_SCHOOL_NAME'),
    contactEmail: getConfigValue('NEXT_PUBLIC_CONTACT_EMAIL'),
    phone: getConfigValue('NEXT_PUBLIC_PHONE'),
    address: getConfigValue('NEXT_PUBLIC_ADDRESS'),
    whatsappNumber: getConfigValue('NEXT_PUBLIC_WHATSAPP_NUMBER'),
    appBaseUrl: getConfigValue('NEXT_PUBLIC_APP_URL'),
};
