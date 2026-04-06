import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rapexa.asllmarket',
  appName: 'Asll Market',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://asllmarket.ir', 
    cleartext: true,
    allowNavigation: ['asllmarket.ir', '*.asllmarket.ir']
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
