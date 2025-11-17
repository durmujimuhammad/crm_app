import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const salesOrderSchema = z.object({
  pipelineId: z.number(),
  customerId: z.number(),
  quotationId: z.number(),
  totalAmount: z.number().positive('Total amount must be positive'),
  status: z.enum(['DRAFT', 'PENDING', 'DONE']),
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

    const salesOrders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        user: { select: { name: true, email: true } },
        quotation: true,
        pipeline: {
          include: {
            lead: true,
          },
        },
        ticket: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(salesOrders)
  } catch (error) {
    console.error('Error fetching sales orders:', error)
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
    const validatedData = salesOrderSchema.parse(body)

    const salesOrder = await prisma.salesOrder.create({
      data: {
        ...validatedData,
        userId: parseInt(session.user.id),
      },
      include: {
        customer: true,
        user: { select: { name: true, email: true } },
        quotation: true,
      },
    })

    // Update pipeline stage to WON
    await prisma.pipeline.update({
      where: { id: validatedData.pipelineId },
      data: { stage: 'WON' },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_SALES_ORDER',
        module: 'SALES',
        details: `Created sales order for amount: ${salesOrder.totalAmount}`,
      },
    })

    return NextResponse.json(salesOrder, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating sales order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
