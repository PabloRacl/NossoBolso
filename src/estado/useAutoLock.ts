import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './useAppStore';

export const INACTIVITY_TIMEOUT_SECONDS = 15 * 60; // 15 minutos (900 segundos)
export const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_SECONDS * 1000;
export const STORAGE_KEY_LAST_ACTIVE = 'nossobolso_last_active_at';
export const STORAGE_KEY_IS_LOCKED = 'nossobolso_app_locked';

export function formatSecondsToTimer(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function useAutoLock() {
  const {
    user,
    isAppLocked,
    sessionSecondsRemaining,
    setIsAppLocked,
    setSessionSecondsRemaining,
    extendSession,
    lockSessionNow,
    unlockSession,
  } = useAppStore();

  const lastActivityReportRef = useRef<number>(Date.now());

  // Inicialização e checagem de timeout pendente ao montar
  useEffect(() => {
    if (!user) {
      setIsAppLocked(false);
      return;
    }

    const lockedFlag = sessionStorage.getItem(STORAGE_KEY_IS_LOCKED);
    if (lockedFlag === 'true') {
      setIsAppLocked(true);
      setSessionSecondsRemaining(0);
      return;
    }

    const lastActiveStr = sessionStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
    if (lastActiveStr) {
      const elapsed = Date.now() - parseInt(lastActiveStr, 10);
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        lockSessionNow();
        return;
      }
      const remainingSeconds = Math.max(0, INACTIVITY_TIMEOUT_SECONDS - Math.floor(elapsed / 1000));
      setSessionSecondsRemaining(remainingSeconds);
    } else {
      sessionStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
      setSessionSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    }
  }, [user, setIsAppLocked, setSessionSecondsRemaining, lockSessionNow]);

  // Loop de contagem regressiva por segundo
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Se a tela já estiver bloqueada, tempo restante é 0
      if (useAppStore.getState().isAppLocked) {
        return;
      }

      const lastActiveStr = sessionStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();
      const elapsedSeconds = Math.floor((Date.now() - lastActive) / 1000);
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_SECONDS - elapsedSeconds);

      setSessionSecondsRemaining(remaining);

      if (remaining <= 0) {
        lockSessionNow();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, setSessionSecondsRemaining, lockSessionNow]);

  // Listener de eventos de atividade com throttling de 1,5 segundos
  const handleUserActivity = useCallback(() => {
    if (!user || useAppStore.getState().isAppLocked) return;

    const now = Date.now();
    // Throttle: evita sobrecarga no sessionStorage com micro-movimentos de mouse e scroll
    if (now - lastActivityReportRef.current > 1500) {
      lastActivityReportRef.current = now;
      sessionStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
      setSessionSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    }
  }, [user, setSessionSecondsRemaining]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'pointerdown'];
    for (const evt of events) {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    }

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, handleUserActivity);
      }
    };
  }, [user, handleUserActivity]);

  return {
    isLocked: isAppLocked,
    secondsRemaining: sessionSecondsRemaining,
    formattedTime: formatSecondsToTimer(sessionSecondsRemaining),
    unlock: unlockSession,
    lockManually: lockSessionNow,
    extendSession,
  };
}
