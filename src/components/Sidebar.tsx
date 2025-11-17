'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ShoppingCart,
  TicketIcon,
  CheckSquare,
  LogOut,
  Target,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Sales', 'Support'] },
  { name: 'Pelanggan', href: '/customers', icon: Users, roles: ['Admin', 'Sales', 'Support'] },
  { name: 'Lead', href: '/leads', icon: Target, roles: ['Admin', 'Sales'] },
  { name: 'Pipeline', href: '/pipeline', icon: TrendingUp, roles: ['Admin', 'Sales'] },
  { name: 'Penjualan', href: '/sales', icon: ShoppingCart, roles: ['Admin', 'Sales'] },
  { name: 'Aktivitas', href: '/activities', icon: CheckSquare, roles: ['Admin', 'Sales'] },
  { name: 'Tiket Support', href: '/tickets', icon: TicketIcon, roles: ['Admin', 'Support'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session) return null

  const userRole = session.user.role

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(userRole)
  )

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">CRM Pro</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg
                  ${isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
          <p className="text-xs text-gray-500">{session.user.email}</p>
          <p className="text-xs text-primary-600 mt-1">{session.user.role}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  )
}
