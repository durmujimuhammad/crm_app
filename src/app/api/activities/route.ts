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
    const done = searchParams.get('done')
    const type = searchParams.get('type')

    const where: any = {}
    if (done !== null) where.done = done === 'true'
    if (type) where.type = type

    const activities = await prisma.salesActivity.findMany({
      where,
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
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
