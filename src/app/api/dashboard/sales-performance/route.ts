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

    // Get sales performance by user
    const salesPerformance = await prisma.user.findMany({
      where: {
        role: {
          name: 'Sales',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        sales: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    const performance = salesPerformance.map(user => {
      const totalSales = user.sales.length
      const completedSales = user.sales.filter(s => s.status === 'DONE').length
      const totalRevenue = user.sales
        .filter(s => s.status === 'DONE')
        .reduce((sum, sale) => sum + sale.totalAmount, 0)

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        totalSales,
        completedSales,
        totalRevenue,
        conversionRate: totalSales > 0 ? (completedSales / totalSales) * 100 : 0,
      }
    })

    return NextResponse.json(performance)
  } catch (error) {
    console.error('Error fetching sales performance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
