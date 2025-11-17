import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { sendTicketNotification } from '@/lib/email'

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateTicketSchema.parse(body)

    const updateData: any = { status: validatedData.status }
    if (validatedData.status === 'RESOLVED' || validatedData.status === 'CLOSED') {
      updateData.resolvedAt = new Date()
    }

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: {
        customer: true,
      },
    })

    // Send email notification
    if (ticket.customer.email) {
      await sendTicketNotification(
        ticket.customer.email,
        ticket.id,
        ticket.title,
        ticket.status
      )
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_TICKET',
        module: 'SUPPORT',
        details: `Updated ticket #${ticket.id} status to ${validatedData.status}`,
      },
    })

    return NextResponse.json(ticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
