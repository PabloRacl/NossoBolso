/**
 * Email Service - NossoBolso Finance OS
 * Utiliza @emailjs/browser para disparo oficial e garantido de e-mails em tempo real.
 */

import emailjs from '@emailjs/browser';
import { getErrorMessage } from '../utilidades/errorUtils';

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
        console.log(`[EmailJS] Enviando e-mail de verificação para ${toEmail}...`);
        
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

    // Em ambiente de produção, nunca vaza códigos OTP se o provedor de e-mail não estiver configurado
    if (import.meta.env.PROD) {
      return {
        success: false,
        message: 'Serviço de envio de e-mails indisponível. Entre em contato com o suporte ou tente novamente mais tarde.',
        isReal: false,
      };
    }

    // Em ambiente de desenvolvimento (DEV), registra no console para facilitar testes locais
    if (import.meta.env.DEV) {
      console.info(`[Dev Simulation] Código de verificação para ${toEmail}: ${code}`);
    }

    return {
      success: true,
      message: `[Modo Desenvolvimento] Código simulado: ${code}`,
      isReal: false,
    };
  },
};
