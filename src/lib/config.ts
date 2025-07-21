function getConfigValue(key: string, required = true, defaultValue = ""): string {
    const value = process.env[key];
    if (required && !value) {
        if (defaultValue) {
            return defaultValue;
        }
        // This error will be caught by Next.js and will provide a clear message.
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || defaultValue;
}

export const schoolConfig = {
    name: getConfigValue('NEXT_PUBLIC_SCHOOL_NAME', true, "Driving School Arwal"),
    contactEmail: getConfigValue('NEXT_PUBLIC_CONTACT_EMAIL', true, "nitishkr3404@gmail.com"),
    phone: getConfigValue('NEXT_PUBLIC_PHONE', true, "+919430420215"),
    address: getConfigValue('NEXT_PUBLIC_ADDRESS', true, "Jinpura Near Police line..and collectorate, Arwal Sipah Panchayat, Bihar 804401"),
    whatsappNumber: getConfigValue('NEXT_PUBLIC_WHATSAPP_NUMBER', true, "919430420215"),
    appBaseUrl: getConfigValue('NEXT_PUBLIC_APP_URL', false, "https://localhost.com:9002"), // no default given here
};
