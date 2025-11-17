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

    // Get customer statistics
    const totalCustomers = await prisma.customer.count()
    const totalLeads = await prisma.customer.count({ where: { type: 'LEAD' } })
    const totalProspects = await prisma.customer.count({ where: { type: 'PROSPECT' } })
    const totalActiveCustomers = await prisma.customer.count({ where: { type: 'CUSTOMER' } })

    // Get pipeline statistics
    const pipelineStats = await prisma.pipeline.groupBy({
      by: ['stage'],
      _count: true,
    })

    // Get sales statistics
    const totalSalesOrders = await prisma.salesOrder.count()
    const completedSalesOrders = await prisma.salesOrder.count({ where: { status: 'DONE' } })
    const totalRevenue = await prisma.salesOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'DONE' },
    })

    // Get ticket statistics
    const totalTickets = await prisma.ticket.count()
    const openTickets = await prisma.ticket.count({ where: { status: 'OPEN' } })
    const resolvedTickets = await prisma.ticket.count({ where: { status: 'RESOLVED' } })

    // Get recent activities
    const recentActivities = await prisma.activityLog.findMany({
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Get sales by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const salesByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(totalAmount) as total
      FROM SalesOrder
      WHERE createdAt >= ${sixMonthsAgo}
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `

    return NextResponse.json({
      customers: {
        total: totalCustomers,
        leads: totalLeads,
        prospects: totalProspects,
        active: totalActiveCustomers,
      },
      pipeline: pipelineStats.reduce((acc, curr) => {
        acc[curr.stage] = curr._count
        return acc
      }, {} as Record<string, number>),
      sales: {
        total: totalSalesOrders,
        completed: completedSalesOrders,
        revenue: totalRevenue._sum.totalAmount || 0,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
      },
      recentActivities,
      salesByMonth,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
