export default {
  appName: `${process.env.NEXT_PUBLIC_APP_NAME || ''}`,
  appUrl: `${process.env.NEXT_PUBLIC_MAIN_DOMAIN_URL || ''}`,
  cdnUrl: `${process.env.NEXT_PUBLIC_CDN_BASE_URL || ''}`,
  apiBaseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}`,
  clientId: `${process.env.NEXT_PUBLIC_API_CLIENT_ID || ''}`,
  recordPerPage: +(process.env.NEXT_PUBLIC_DEFAULT_RECORD_PER_PAGE || 25),
  enviroment: process.env.NODE_ENV || 'development',
  recaptchaSitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || '',
};
