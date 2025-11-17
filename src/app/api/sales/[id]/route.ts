import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateSalesOrderSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'DONE']),
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
    const validatedData = updateSalesOrderSchema.parse(body)

    const salesOrder = await prisma.salesOrder.update({
      where: { id: parseInt(params.id) },
      data: validatedData,
      include: {
        customer: true,
        user: { select: { name: true, email: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_SALES_ORDER',
        module: 'SALES',
        details: `Updated sales order status to ${validatedData.status}`,
      },
    })

    return NextResponse.json(salesOrder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating sales order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
