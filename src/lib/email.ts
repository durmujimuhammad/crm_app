import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@crm.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}

export const sendReminderEmail = async (email: string, activityName: string, dueDate: Date) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Reminder: ${activityName}</h2>
      <p>This is a reminder about your upcoming activity:</p>
      <p><strong>Activity:</strong> ${activityName}</p>
      <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}</p>
      <p>Please complete this activity on time.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This is an automated message from CRM System</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Reminder: ${activityName}`,
    html,
  })
}

export const sendTicketNotification = async (
  email: string,
  ticketId: number,
  title: string,
  status: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Ticket Update</h2>
      <p><strong>Ticket ID:</strong> #${ticketId}</p>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${status}</span></p>
      <p>Your ticket status has been updated. Please check the CRM for more details.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This is an automated message from CRM System</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Ticket #${ticketId} - ${status}`,
    html,
  })
}
