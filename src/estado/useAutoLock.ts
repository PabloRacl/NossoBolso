import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './useAppStore';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inatividade
const STORAGE_KEY_LAST_ACTIVE = 'nossobolso_last_active_at';
const STORAGE_KEY_IS_LOCKED = 'nossobolso_app_locked';

export function useAutoLock() {
  const { user } = useAppStore();
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // Se não estiver logado, não precisa bloquear
    const savedUser = localStorage.getItem('nossobolso_auth_user');
    if (!savedUser) return false;

    const lockedFlag = sessionStorage.getItem(STORAGE_KEY_IS_LOCKED);
    if (lockedFlag === 'true') return true;

    const lastActiveStr = sessionStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
    if (lastActiveStr) {
      const elapsed = Date.now() - parseInt(lastActiveStr, 10);
      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        return true;
      }
    }
    return false;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (!user) return;
    sessionStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsLocked(true);
      sessionStorage.setItem(STORAGE_KEY_IS_LOCKED, 'true');
    }, INACTIVITY_TIMEOUT_MS);
  }, [user]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    sessionStorage.removeItem(STORAGE_KEY_IS_LOCKED);
    sessionStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
    resetTimer();
  }, [resetTimer]);

  const lockManually = useCallback(() => {
    if (!user) return;
    setIsLocked(true);
    sessionStorage.setItem(STORAGE_KEY_IS_LOCKED, 'true');
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsLocked(false);
      sessionStorage.removeItem(STORAGE_KEY_IS_LOCKED);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    resetTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      // Só reseta o contador se a tela não estiver bloqueada
      if (!isLocked) {
        resetTimer();
      }
    };

    for (const evt of activityEvents) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const evt of activityEvents) {
        window.removeEventListener(evt, handleActivity);
      }
    };
  }, [user, isLocked, resetTimer]);

  return { isLocked, unlock, lockManually };
}
