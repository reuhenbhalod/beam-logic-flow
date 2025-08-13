import { Clock, Plus, AlertTriangle, TrendingUp, DollarSign, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TimeLogger from '@/components/TimeLogger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

const weeklyData = [
  { day: 'Mon', drafting: 6, engineering: 8, pm: 2 },
  { day: 'Tue', drafting: 4, engineering: 6, pm: 3 },
  { day: 'Wed', drafting: 8, engineering: 4, pm: 1 },
  { day: 'Thu', drafting: 5, engineering: 7, pm: 2 },
  { day: 'Fri', drafting: 3, engineering: 5, pm: 4 },
];

const chartConfig = {
  drafting: { label: 'Drafting', color: 'hsl(var(--engineering-red))' },
  engineering: { label: 'Engineering', color: 'hsl(var(--engineering-red-light))' },
  pm: { label: 'PM', color: 'hsl(var(--engineering-gray))' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalHours: 0,
    totalFees: 0,
    burnRateData: [],
    roleDistribution: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*');

      // Fetch time entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('*');

      if (projects && timeEntries) {
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const totalFees = projects.reduce((sum, project) => sum + (project.fee || 0), 0);

        // Calculate burn rate data
        const burnRateData = projects.map(project => {
          const projectHours = timeEntries
            .filter(entry => entry.project_id === project.id)
            .reduce((sum, entry) => sum + entry.hours, 0);
          
          const projectCost = projectHours * (project.target_hourly_rate || 0);
          const feeUsed = (projectCost / (project.fee || 1)) * 100;
          
          // Calculate time elapsed percentage
          const startDate = new Date(project.start_date || project.created_at);
          const endDate = project.end_date ? new Date(project.end_date) : new Date();
          const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          const daysElapsed = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          const timeElapsed = Math.min((daysElapsed / Math.max(totalDays, 1)) * 100, 100);

          return {
            name: project.name,
            feeUsed: Math.min(feeUsed, 100),
            timeElapsed: Math.max(timeElapsed, 0),
            status: feeUsed > timeElapsed ? 'Over Budget' : 'On Track'
          };
        });

        // Calculate role distribution
        const roleHours = {};
        timeEntries.forEach(entry => {
          const role = entry.role || 'Unknown';
          roleHours[role] = (roleHours[role] || 0) + entry.hours;
        });

        const roleDistribution = Object.entries(roleHours).map(([role, hours]) => ({
          name: role,
          value: hours
        }));

        setDashboardData({
          totalProjects,
          activeProjects,
          totalHours,
          totalFees,
          burnRateData,
          roleDistribution
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <TimeLogger />
        <Button 
          variant="outline" 
          className="border-engineering-red text-engineering-red hover:bg-engineering-red hover:text-white" 
          onClick={() => navigate('/projects')}
          data-interactive
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.activeProjects} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Hours logged
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Project value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hourly Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData.totalHours > 0 ? (dashboardData.totalFees / dashboardData.totalHours).toFixed(0) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-engineering-red">6.5</div>
            <p className="text-xs text-muted-foreground">+2.3 from yesterday</p>
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 due this week</p>
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Week Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="engineering-card border-status-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-warning">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Hours Chart */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle>Weekly Hours by Role</CardTitle>
          <CardDescription>Time distribution across different roles this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="drafting" fill="var(--color-drafting)" />
              <Bar dataKey="engineering" fill="var(--color-engineering)" />
              <Bar dataKey="pm" fill="var(--color-pm)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Burn Rate Chart */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle>Burn Rate Analysis</CardTitle>
          <CardDescription>Fee used vs Time elapsed by project</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.burnRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip>
                {({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{label}</div>
                          </div>
                          {payload.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: item.dataKey === 'feeUsed' ? '#ef4444' : '#3b82f6' }}
                              />
                              <span className="font-medium text-muted-foreground">
                                {item.dataKey === 'feeUsed' ? 'Fee Used' : 'Time Elapsed'}:
                              </span>
                              <span className="font-medium">{item.value.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              </ChartTooltip>
              <Bar dataKey="feeUsed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Fee Used" />
              <Bar dataKey="timeElapsed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Time Elapsed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Role Distribution Chart */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle>Hours by Role</CardTitle>
          <CardDescription>Distribution of logged hours by role</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]} />
                ))}
              </Pie>
              <ChartTooltip>
                {({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{payload[0].name}</div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-muted-foreground">Hours:</span>
                            <span className="font-medium">{payload[0].value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              </ChartTooltip>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Office Complex Phase 1', progress: 75, status: 'active' },
              { name: 'Residential Tower Foundation', progress: 45, status: 'active' },
              { name: 'Industrial Warehouse Retrofit', progress: 20, status: 'planning' },
            ].map((project, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{project.name}</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      project.status === 'active' ? 'status-active' : 'status-warning'
                    }`} />
                    <span className="text-xs text-muted-foreground capitalize">{project.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{project.progress}%</p>
                  <Progress value={project.progress} className="w-[60px]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-status-warning/20 bg-status-warning/5">
              <p className="text-sm font-medium text-status-warning">Budget Alert</p>
              <p className="text-xs text-muted-foreground">Office Complex has exceeded 80% fee allocation</p>
            </div>
            <div className="p-3 rounded-lg border border-status-danger/20 bg-status-danger/5">
              <p className="text-sm font-medium text-status-danger">Time Entry Missing</p>
              <p className="text-xs text-muted-foreground">No time logged for yesterday</p>
            </div>
            <div className="p-3 rounded-lg border border-status-info/20 bg-status-info/5">
              <p className="text-sm font-medium text-status-info">Milestone Due</p>
              <p className="text-xs text-muted-foreground">Residential Tower design review due tomorrow</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;