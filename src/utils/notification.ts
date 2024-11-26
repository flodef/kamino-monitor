// Create an audio context for playing notification sounds
let audioContext: AudioContext | null = null;

export type NotificationOptions = {
  title: string;
  body: string;
  silent?: boolean;
};

export async function showNotification({ title, body, silent = false }: NotificationOptions) {
  // Request permission if needed
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }
  }

  // Create and show the notification
  const notification = new Notification(title, {
    body,
    silent,
  });

  // Play notification sound if not silent
  if (!silent) {
    try {
      if (!audioContext) {
        audioContext = new AudioContext();
      }

      // Create an oscillator for a simple "ding" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note

      // Set volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

      // Start and stop the sound
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  return notification;
}
