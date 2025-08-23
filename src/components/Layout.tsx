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
  LogOut,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';

import TimeLogger from './TimeLogger';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'People', href: '/people', icon: Users },
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
      <div className="flex h-20 shrink-0 items-center border-b border-neutral-800/20 px-6 bg-dark-gradient">
        <Link 
          to="/" 
          className="flex items-center gap-3 group transition-all duration-200 cursor-pointer"
          onClick={() => mobile && setSidebarOpen(false)}
        >
                         {/* I.L. Gross Logo */}
               <div className="relative">
                 <div className="w-10 h-10 bg-gradient-to-br from-brand-red-600 to-brand-red-700 transform rotate-45 shadow-xl flex items-center justify-center">
                   <span className="text-white font-bold text-sm -rotate-45">ILG</span>
                 </div>
                 <div className="absolute inset-0 border-2 border-white/20 rounded-sm transform rotate-45"></div>
               </div>
          
          {/* Company Name */}
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white group-hover:text-brand-red-300 transition-colors">I.L. Gross</span>
            <span className="text-xs text-neutral-300 font-medium">Engineering</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 bg-dark-gradient p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative
                ${isActive
                  ? 'glass-card text-brand-red-400 shadow-lg border border-brand-red-500/30'
                  : 'text-neutral-300 hover:glass-card hover:text-white hover:shadow-md'
                }
              `}
              onClick={() => mobile && setSidebarOpen(false)}
              data-interactive
            >
              <div className={`
                w-2 h-2 rounded-full mr-3 transition-all duration-200
                ${isActive ? 'bg-brand-red-500' : 'bg-neutral-500 group-hover:bg-brand-red-400'}
              `}></div>
              <item.icon 
                className={`h-5 w-5 transition-all duration-200 ${isActive ? 'text-brand-red-400' : 'text-neutral-400 group-hover:text-white'}`} 
              />
              <span className="ml-3">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-neutral-800/20 p-4 bg-dark-gradient">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-red-600 to-brand-red-700 flex items-center justify-center shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </p>
            <p className="text-xs text-neutral-300 truncate">
              {user?.user_metadata?.role || 'Engineer'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-brand-red-600/20 hover:text-brand-red-400 transition-all duration-200 rounded-lg text-neutral-400"
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
    <div className="h-screen flex overflow-hidden bg-dark abstract-bg">
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-dark border-neutral-800/20">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 glass-card border-b border-neutral-800/20 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            className="px-4 border-r border-neutral-800/20 md:hidden hover:bg-brand-red-600/20 hover:text-brand-red-400 transition-all duration-200 text-neutral-300"
            onClick={() => setSidebarOpen(true)}
            data-interactive
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand-red-500 rounded-full shadow-sm"></div>
                <h2 className="text-xl font-bold text-white">
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