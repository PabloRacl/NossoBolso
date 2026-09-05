export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    alert('Seu navegador não possui suporte para Notificações Web.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendBrowserNotification(title: string, body: string, icon = '👛'): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">👛</text></svg>',
    });
  } catch (err) {
    console.error('Erro ao enviar notificação do navegador:', err);
  }
}
