import nodemailer from 'nodemailer';
import { logger } from './logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      
      logger.info('Email sent successfully', { to: options.to, subject: options.subject });
    } catch (error) {
      logger.error('Failed to send email', error as Error, { to: options.to });
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Bem-vindo ao MeChama!</h2>
        <p>Para completar seu cadastro, clique no link abaixo para verificar seu email:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Verificar Email
        </a>
        <p>Se você não se cadastrou no MeChama, ignore este email.</p>
        <p>Este link expira em 24 horas.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verificação de Email - MeChama',
      html,
      text: `Bem-vindo ao MeChama! Verifique seu email acessando: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Redefinir Senha - MeChama</h2>
        <p>Você solicitou a redefinição de sua senha. Clique no link abaixo:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Redefinir Senha
        </a>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
        <p>Este link expira em 1 hora.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Redefinir Senha - MeChama',
      html,
      text: `Redefina sua senha acessando: ${resetUrl}`,
    });
  }

  async sendBookingConfirmationEmail(
    email: string, 
    booking: {
      id: string;
      serviceName: string;
      professionalName: string;
      scheduledAt: Date;
      totalAmount: number;
    }
  ): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #28a745;">Agendamento Confirmado!</h2>
        <p>Seu agendamento foi confirmado com sucesso:</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p><strong>Serviço:</strong> ${booking.serviceName}</p>
          <p><strong>Profissional:</strong> ${booking.professionalName}</p>
          <p><strong>Data/Hora:</strong> ${booking.scheduledAt.toLocaleString('pt-BR')}</p>
          <p><strong>Valor:</strong> R$ ${booking.totalAmount.toFixed(2)}</p>
          <p><strong>ID do Agendamento:</strong> ${booking.id}</p>
        </div>
        <p>Você receberá lembretes antes do horário agendado.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Agendamento Confirmado - MeChama',
      html,
    });
  }
}