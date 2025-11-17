import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const leadSchema = z.object({
  source: z.string().optional().nullable(),
  status: z.enum(['NEW', 'PROSPECT', 'DEAL', 'LOST']),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        pipeline: {
          include: {
            activities: true,
            quotations: true,
            salesOrder: true,
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const validatedData = leadSchema.parse(body)

    const lead = await prisma.lead.update({
      where: { id: parseInt(params.id) },
      data: validatedData,
      include: {
        customer: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_LEAD',
        module: 'LEAD',
        details: `Updated lead status to ${validatedData.status}`,
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
