/**
 * Email Service - NossoBolso Finance OS
 * Utiliza @emailjs/browser para disparo oficial e garantido de e-mails em tempo real.
 */

import emailjs from '@emailjs/browser';
import { getErrorMessage } from '../utils/errorUtils';

interface SendVerificationEmailParams {
  toName: string;
  toEmail: string;
  code: string;
}

export const emailService = {
  /**
   * Verifica se as chaves do EmailJS estão configuradas no .env
   */
  isRealEmailConfigured(): boolean {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : (process.env as Record<string, string | undefined>);
    return Boolean(env?.VITE_EMAILJS_SERVICE_ID && env?.VITE_EMAILJS_PUBLIC_KEY);
  },

  /**
   * Envia o e-mail real em tempo real usando o SDK oficial do EmailJS.
   */
  async sendVerificationCode({ toName, toEmail, code }: SendVerificationEmailParams): Promise<{ success: boolean; message: string; isReal: boolean }> {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : (process.env as Record<string, string | undefined>);

    const serviceId = env?.VITE_EMAILJS_SERVICE_ID;
    const templateId = env?.VITE_EMAILJS_TEMPLATE_ID || 'template_hxqruph';
    const publicKey = env?.VITE_EMAILJS_PUBLIC_KEY;

    if (serviceId && publicKey) {
      try {
        console.log(`[EmailJS] Enviando e-mail real para ${toEmail} com o código ${code}...`);
        
        const response = await emailjs.send(
          serviceId,
          templateId,
          {
            to_name: toName,
            to_email: toEmail,
            email: toEmail,
            user_email: toEmail,
            reply_to: toEmail,
            code: code,
            verification_code: code,
            passcode: code,
            app_name: 'NossoBolso Finance OS',
          },
          publicKey
        );

        console.log('[EmailJS] Resposta de Sucesso:', response);

        return {
          success: true,
          message: `E-mail enviado com sucesso em tempo real para ${toEmail}! Verifique sua caixa de entrada e Spam.`,
          isReal: true,
        };
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err);
        console.error('[EmailJS Error]:', err);
        return {
          success: false,
          message: `Falha no envio pelo EmailJS: ${errorMsg}`,
          isReal: false,
        };
      }
    }

    return {
      success: true,
      message: `[Modo Simulação] O código de verificação é: ${code}`,
      isReal: false,
    };
  },
};
