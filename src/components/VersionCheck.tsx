import { useEffect } from 'react';
import { APP_VERSION } from '../config/version';

export const VersionCheck = () => {
  useEffect(() => {
    const checkForUpdates = () => {
      const storedVersion = localStorage.getItem('app_version');

      if (storedVersion && storedVersion !== APP_VERSION) {
        console.log(`New version detected: ${APP_VERSION} (old: ${storedVersion}). Clearing cache...`);
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Set new version
        localStorage.setItem('app_version', APP_VERSION);
        
        // Hard reload to fetch fresh assets
        window.location.reload();
      } else if (!storedVersion) {
        // First run or after clear
        localStorage.setItem('app_version', APP_VERSION);
      }
    };

    checkForUpdates();
  }, []);

  return null;
};
