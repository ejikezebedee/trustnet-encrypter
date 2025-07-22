import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9705dc4a8519410dab24598036e7d468',
  appName: 'TrustNet ID',
  webDir: 'dist',
  server: {
    url: 'https://9705dc4a-8519-410d-ab24-598036e7d468.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0C162D",
      showSpinner: true,
      spinnerColor: "#5F8AFF"
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#5F8AFF"
    }
  }
};

export default config;