import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const activitySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['TASK', 'MEETING', 'FOLLOW_UP']),
  dueDate: z.string().transform(str => new Date(str)),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = activitySchema.parse(body)

    const activity = await prisma.salesActivity.create({
      data: {
        pipelineId: parseInt(params.id),
        ...validatedData,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_ACTIVITY',
        module: 'PIPELINE',
        details: `Created ${validatedData.type} activity`,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
