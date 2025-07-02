import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  UserCog,
  Phone, 
  Bell, 
  Search, 
  History, // Add History icon for activity logs
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Calls', href: '/calls', icon: Phone },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Activity Logs', href: '/activity-logs', icon: History },
  ];

  if (user?.role === 'admin') {
    navigation.splice(3, 0, { name: 'Users', href: '/users', icon: UserCog });
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-auto 
          ${isMobileMenuOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'} 
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex justify-between items-center px-4 h-16 border-b border-gray-200">
          <div className="flex items-center">
            {isCollapsed ? (
              <div className="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center text-white font-bold text-lg">BT</div>
            ) : (
              <h1 className="text-xl font-bold text-gray-900">Better Tasks</h1>
            )}
          </div>
          <div className="flex gap-2">
            {/* Collapse toggle visible only on desktop */}
            <button
              onClick={toggleCollapse}
              className="hidden p-2 rounded-md lg:inline-flex hover:bg-gray-100"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
            {/* Close button for mobile */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <nav className="px-3 mt-6">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="flex-shrink-0 mr-3 w-5 h-5" />
                {!isCollapsed && item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="absolute right-0 bottom-0 left-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="flex justify-center items-center w-8 h-8 rounded-full bg-primary-500">
                <span className="text-sm font-medium text-white">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{!isCollapsed && user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className={`w-4 h-4 ${isCollapsed ? '':'mr-3'}`} />
            {!isCollapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-5' : 'lg:ml-5'}`}>
        {/* Mobile header */}
        <div className="flex sticky top-0 z-40 justify-between items-center px-4 h-16 bg-white border-b border-gray-200 lg:hidden">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Better Tasks</h1>
          <div></div>
        </div>

        {/* Page content */}
        <main className="flex p-4 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;