import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const quotationSchema = z.object({
  pipelineId: z.number(),
  amount: z.number().positive('Amount must be positive'),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quotations = await prisma.quotation.findMany({
      include: {
        pipeline: {
          include: {
            lead: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(quotations)
  } catch (error) {
    console.error('Error fetching quotations:', error)
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
    const validatedData = quotationSchema.parse(body)

    const quotation = await prisma.quotation.create({
      data: validatedData,
      include: {
        pipeline: {
          include: {
            lead: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_QUOTATION',
        module: 'SALES',
        details: `Created quotation for amount: ${quotation.amount}`,
      },
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating quotation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
