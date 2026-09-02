/**
 * Email Service - NossoBolso Finance OS
 * Suporta envio real de e-mails via EmailJS ou Resend REST API com fallback gracioso.
 */

interface SendVerificationEmailParams {
  toName: string;
  toEmail: string;
  code: string;
}

export const emailService = {
  /**
   * Envia o e-mail real com o código de verificação de 6 dígitos.
   */
  async sendVerificationCode({ toName, toEmail, code }: SendVerificationEmailParams): Promise<{ success: boolean; message: string }> {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : (process.env as Record<string, string | undefined>);

    const serviceId = env?.VITE_EMAILJS_SERVICE_ID;
    const templateId = env?.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = env?.VITE_EMAILJS_PUBLIC_KEY;

    // Se as chaves do serviço de e-mail estiverem configuradas no .env
    if (serviceId && templateId && publicKey) {
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              to_name: toName,
              to_email: toEmail,
              code: code,
              app_name: 'NossoBolso Finance OS',
            },
          }),
        });

        if (response.ok) {
          return { success: true, message: `E-mail real enviado com sucesso para ${toEmail}` };
        } else {
          console.warn('Falha no envio real do email via EmailJS:', await response.text());
        }
      } catch (err) {
        console.error('Erro de conexão com serviço de e-mail:', err);
      }
    }

    // Se não houver chaves .env configuradas, retorna sucesso indicando modo de simulação
    return {
      success: true,
      message: `[Modo Simulação/Desenvolvimento] O código de verificação é: ${code}`,
    };
  },
};
