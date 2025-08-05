import { Clock, Plus, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import TimeLogger from '@/components/TimeLogger';

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
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <TimeLogger />
        <Button variant="outline" className="border-engineering-red text-engineering-red hover:bg-engineering-red hover:text-white" data-interactive>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
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