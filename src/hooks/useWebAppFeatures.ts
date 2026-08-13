import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const NOTIFICATIONS_ENABLED_KEY = 'deskflow_browser_notifications_enabled';
const INSTALL_PROMPT_CAPTURED_EVENT = 'deskflow-install-prompt-captured';
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let notificationAudioContext: AudioContext | null = null;

const playNotificationSound = async () => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    notificationAudioContext ||= new AudioContextClass();
    if (notificationAudioContext.state === 'suspended') await notificationAudioContext.resume();

    const context = notificationAudioContext;
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    gain.connect(context.destination);

    [880, 1175].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now + index * 0.08);
      oscillator.stop(now + 0.24);
    });
  } catch (error) {
    // Browser autoplay policies may block notification audio; the notification remains usable.
    console.debug('Notification sound unavailable:', error);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.dispatchEvent(new Event(INSTALL_PROMPT_CAPTURED_EVENT));
  });
}

export const isStandaloneWebApp = (): boolean => window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

export function useWebAppFeatures() {
  const [installAvailable, setInstallAvailable] = useState(Boolean(deferredInstallPrompt));
  const [isInstalled, setIsInstalled] = useState(isStandaloneWebApp);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === 'true' && 'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    const handleInstallPrompt = () => setInstallAvailable(Boolean(deferredInstallPrompt));
    const handleInstalled = () => {
      deferredInstallPrompt = null;
      setInstallAvailable(false);
      setIsInstalled(true);
    };
    window.addEventListener(INSTALL_PROMPT_CAPTURED_EVENT, handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener(INSTALL_PROMPT_CAPTURED_EVENT, handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installApp = async (): Promise<{ success: boolean; message?: string }> => {
    if (isInstalled) return { success: false, message: 'DeskFlow is already installed.' };
    if (!deferredInstallPrompt) {
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      return {
        success: false,
        message: isIos
          ? 'In Safari, tap Share, then Add to Home Screen.'
          : 'Use your browser menu and choose Install DeskFlow or Add to Home screen.'
      };
    }
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setInstallAvailable(false);
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      return { success: true, message: 'DeskFlow was installed.' };
    }
    return { success: false, message: 'Installation was cancelled.' };
  };

  const toggleNotifications = async (): Promise<{ success: boolean; message: string }> => {
    if (!('Notification' in window)) return { success: false, message: 'This browser does not support web notifications.' };
    if (notificationsEnabled) {
      localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      setNotificationsEnabled(false);
      return { success: true, message: 'Browser notifications were disabled for DeskFlow.' };
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission !== 'granted') {
      localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      return {
        success: false,
        message: permission === 'denied'
          ? 'Notifications are blocked. Allow them in your browser site settings.'
          : 'Notification permission was not granted.'
      };
    }
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
    setNotificationsEnabled(true);
    try {
      await showDeskFlowNotification('DeskFlow notifications enabled', {
        body: 'You will receive alerts for new direct messages.',
        tag: 'deskflow-notifications-enabled'
      });
    } catch (error) {
      console.error('Unable to display the notification test.', error);
    }
    return { success: true, message: 'Browser notifications are enabled.' };
  };

  return { installAvailable, isInstalled, installApp, notificationPermission, notificationsEnabled, toggleNotifications };
}

export async function showDeskFlowNotification(title: string, options: NotificationOptions = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'true') return;
  void playNotificationSound();
  const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  if (registration) {
    await registration.showNotification(title, { icon: '/deskflow-icon-192.png', badge: '/deskflow-icon-192.png', ...options });
  } else {
    new Notification(title, { icon: '/deskflow-icon-192.png', ...options });
  }
}
