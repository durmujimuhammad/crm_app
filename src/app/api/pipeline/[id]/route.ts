import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const pipelineSchema = z.object({
  stage: z.enum(['LEAD', 'PROSPECT', 'DEAL', 'WON', 'LOST']),
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
    const validatedData = pipelineSchema.parse(body)

    const pipeline = await prisma.pipeline.update({
      where: { id: parseInt(params.id) },
      data: validatedData,
      include: {
        lead: {
          include: {
            customer: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_PIPELINE',
        module: 'PIPELINE',
        details: `Moved pipeline to ${validatedData.stage} stage`,
      },
    })

    return NextResponse.json(pipeline)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating pipeline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
