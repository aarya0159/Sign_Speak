import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.signspeak.aarya',
  appName: 'SignSpeak',
  webDir: 'www',
  server: {
    url: 'https://sign-speak-sigma.vercel.app/',
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
