import { useState, useEffect } from 'react';

interface UseCheckoutTimerProps {
  expiresAt: Date | string | null;
  onExpired?: () => void;
}

interface TimeRemaining {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  timeString: string;
}

/**
 * Hook for managing checkout countdown timer
 * Similar to StubHub's checkout timer
 */
export function useCheckoutTimer({ expiresAt, onExpired }: UseCheckoutTimerProps): TimeRemaining {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
    timeString: '00:00',
  });

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining({
        minutes: 0,
        seconds: 0,
        isExpired: true,
        timeString: '00:00',
      });
      return;
    }

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeRemaining({
          minutes: 0,
          seconds: 0,
          isExpired: true,
          timeString: '00:00',
        });
        
        if (onExpired) {
          onExpired();
        }
        return;
      }

      const minutes = Math.floor(difference / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      setTimeRemaining({
        minutes,
        seconds,
        isExpired: false,
        timeString,
      });
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  return timeRemaining;
}
