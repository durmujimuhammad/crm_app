import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const leadSchema = z.object({
  customerId: z.number(),
  source: z.string().optional().nullable(),
  status: z.enum(['NEW', 'PROSPECT', 'DEAL', 'LOST']),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const leads = await prisma.lead.findMany({
      where,
      include: {
        customer: true,
        pipeline: {
          include: {
            activities: true,
            quotations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching leads:', error)
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
    const validatedData = leadSchema.parse(body)

    const lead = await prisma.lead.create({
      data: validatedData,
      include: {
        customer: true,
      },
    })

    // Create pipeline for the lead
    await prisma.pipeline.create({
      data: {
        leadId: lead.id,
        stage: 'LEAD',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_LEAD',
        module: 'LEAD',
        details: `Created lead for customer: ${lead.customer.name}`,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
