import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  FileText, 
  Menu,
  Clock,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CustomCursor from './CustomCursor';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Analysis', href: '/analysis', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex h-full flex-col ${mobile ? 'w-full' : 'w-64'}`}>
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6 bg-gradient-primary">
        <h1 className="text-xl font-bold text-primary-foreground">
          StructureFlow
        </h1>
      </div>
      <nav className="flex-1 space-y-1 bg-card p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'text-muted-foreground hover:bg-engineering-red/10 hover:text-engineering-red'
                }
              `}
              onClick={() => mobile && setSidebarOpen(false)}
              data-interactive
            >
              <item.icon 
                className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-current'}`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-engineering-red flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              John Engineer
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Senior Engineer
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background abstract-bg">
      <CustomCursor />
      
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
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-card border-b border-border shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="px-4 border-r border-border md:hidden"
            onClick={() => setSidebarOpen(true)}
            data-interactive
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h2 className="text-lg font-semibold text-foreground">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-engineering-red text-engineering-red hover:bg-engineering-red hover:text-white"
                data-interactive
              >
                <Clock className="h-4 w-4 mr-2" />
                Log Time
              </Button>
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