import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateActivitySchema = z.object({
  done: z.boolean(),
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
    const validatedData = updateActivitySchema.parse(body)

    const activity = await prisma.salesActivity.update({
      where: { id: parseInt(params.id) },
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
        action: 'UPDATE_ACTIVITY',
        module: 'ACTIVITY',
        details: `Marked activity as ${validatedData.done ? 'done' : 'undone'}`,
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
