import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, History, Settings, FolderOpen, Plus, FileImage, MessageSquare, Map } from 'lucide-react'

const navSections = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/projects', label: 'Projects', icon: FolderOpen },
      { path: '/history', label: 'History', icon: History },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { path: '/analysis/new', label: 'New Analysis', icon: MessageSquare },
      { path: '/projects/new', label: 'New Project', icon: Plus },
    ],
  },
]

export default function Sidebar() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isAuthenticated) return null

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-space-900/95 backdrop-blur-lg border-r border-space-700 z-40 hidden lg:block">
      <nav className="p-4 space-y-6" aria-label="Sidebar navigation">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-2 text-xs font-display font-semibold text-space-500 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1" role="list">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan'
                          : 'text-space-400 hover:text-space-100 hover:bg-space-800'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        <div className="pt-6 border-t border-space-700">
          <h3 className="px-2 text-xs font-display font-semibold text-space-500 uppercase tracking-wider mb-3">
            QUICK ACTIONS
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/projects/new')}
              className="w-full btn-primary justify-start"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Project
            </button>
            <button
              onClick={() => navigate('/analysis/new')}
              className="w-full btn-secondary justify-start"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              AI Assistant
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-space-700 bg-space-900/95">
        <div className="text-xs text-space-500 text-center">
          SATQUERY AI v1.0.0
        </div>
      </div>
    </aside>
  )
}