import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')

    const where: any = {}
    if (stage) where.stage = stage

    const pipelines = await prisma.pipeline.findMany({
      where,
      include: {
        lead: {
          include: {
            customer: true,
          },
        },
        activities: {
          orderBy: { dueDate: 'asc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
        salesOrder: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(pipelines)
  } catch (error) {
    console.error('Error fetching pipelines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
