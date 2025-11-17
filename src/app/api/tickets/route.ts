import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { sendTicketNotification } from '@/lib/email'

const ticketSchema = z.object({
  salesOrderId: z.number(),
  customerId: z.number(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  deadline: z.string().transform(str => new Date(str)),
  slaMinutes: z.number(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: true,
        salesOrder: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = ticketSchema.parse(body)

    const ticket = await prisma.ticket.create({
      data: {
        ...validatedData,
        status: 'OPEN',
      },
      include: {
        customer: true,
        salesOrder: true,
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
        action: 'CREATE_TICKET',
        module: 'SUPPORT',
        details: `Created ticket: ${ticket.title}`,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
