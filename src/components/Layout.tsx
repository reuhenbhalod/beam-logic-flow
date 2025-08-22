import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  FileText, 
  Menu,
  Clock,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';

import TimeLogger from './TimeLogger';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Analysis', href: '/analysis', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();



  const Sidebar = ({ mobile = false }) => (
    <div className={`flex h-full flex-col ${mobile ? 'w-full' : 'w-64'}`}>
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6 bg-white shadow-sm">
        <Link 
          to="/" 
          className="text-xl font-bold text-slate-700 hover:text-red-600 transition-all duration-200 cursor-pointer flex items-center gap-2 group"
          onClick={() => mobile && setSidebarOpen(false)}
        >
          <div className="w-2 h-2 bg-red-600 rounded-full group-hover:bg-red-500 transition-colors"></div>
          StructureFlow
        </Link>
      </div>
      <nav className="flex-1 space-y-2 bg-white p-6">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden
                ${isActive
                  ? 'bg-red-600 text-white shadow-sm transform scale-105'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
              onClick={() => mobile && setSidebarOpen(false)}
              data-interactive
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-r-full"></div>
              )}
              <item.icon 
                className={`mr-3 h-5 w-5 transition-transform duration-200 ${isActive ? 'text-white transform scale-110' : 'text-current group-hover:scale-110'}`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-6 bg-white">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.user_metadata?.role || 'Engineer'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 rounded-lg"
            onClick={async () => {
              await signOut();
              navigate('/signin');
            }}
            data-interactive
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background abstract-bg">

      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="px-4 border-r border-slate-200 md:hidden hover:bg-slate-50 transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
            data-interactive
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <h2 className="text-xl font-semibold text-slate-700">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h2>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <TimeLogger />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;