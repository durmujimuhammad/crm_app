import axios from 'axios'

export interface WhatsAppMessage {
  phone: string
  message: string
}

export const sendWhatsApp = async ({ phone, message }: WhatsAppMessage) => {
  try {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) {
      console.warn('WhatsApp API not configured')
      return { success: false, error: 'WhatsApp API not configured' }
    }

    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/send`,
      {
        phone: phone.replace(/[^0-9]/g, ''),
        message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        },
      }
    )

    return { success: true, data: response.data }
  } catch (error) {
    console.error('WhatsApp error:', error)
    return { success: false, error }
  }
}

export const sendReminderWhatsApp = async (
  phone: string,
  activityName: string,
  dueDate: Date
) => {
  const message = `*Reminder: ${activityName}*\n\nJatuh tempo: ${dueDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}\n\nMohon selesaikan aktivitas ini tepat waktu.\n\n_Pesan otomatis dari CRM System_`

  return sendWhatsApp({ phone, message })
}

export const sendTicketNotificationWhatsApp = async (
  phone: string,
  ticketId: number,
  title: string,
  status: string
) => {
  const message = `*Update Tiket*\n\nTicket ID: #${ticketId}\nJudul: ${title}\nStatus: *${status}*\n\nSilakan cek CRM untuk detail lebih lanjut.\n\n_Pesan otomatis dari CRM System_`

  return sendWhatsApp({ phone, message })
}
