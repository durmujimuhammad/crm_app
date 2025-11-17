import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const interactionSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'CHAT', 'VISIT']),
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
    const validatedData = interactionSchema.parse(body)

    const interaction = await prisma.interaction.create({
      data: {
        customerId: parseInt(params.id),
        userId: parseInt(session.user.id),
        ...validatedData,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_INTERACTION',
        module: 'CUSTOMER',
        details: `Added ${validatedData.type} interaction`,
      },
    })

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating interaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
