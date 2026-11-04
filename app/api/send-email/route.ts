import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Force Node.js runtime (required for Nodemailer TCP/TLS socket connections)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_MAIL_SECRET ;

    if (!authHeader || authHeader !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, html, text } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

    const emailUser =
      process.env.EMAIL_USER || process.env.MAIL_USERNAME || 'ranahammadismail@gmail.com';
    let emailPass = process.env.EMAIL_PASS || process.env.MAIL_PASSWORD || '';
    emailPass = emailPass.replace(/^["']|["']$/g, '').trim();

    // Use Port 465 with SSL (fully supported on Vercel)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"UNISON Alumni Network" <${emailUser}>`,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error dispatching email on Vercel:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

