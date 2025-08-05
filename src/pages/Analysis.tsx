import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Clock, DollarSign, Users, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type TimeEntry = Database['public']['Tables']['time_entries']['Row']

const Analysis = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')

      // Fetch time entries
      const { data: timeData } = await supabase
        .from('time_entries')
        .select('*')

      setProjects(projectsData || [])
      setTimeEntries(timeData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const avgProgress = projects.length > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length : 0

  // Generate chart data
  const projectStatusData = [
    { name: 'Active', value: activeProjects, color: 'hsl(var(--status-active))' },
    { name: 'Completed', value: completedProjects, color: 'hsl(var(--status-info))' },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: 'hsl(var(--status-warning))' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, color: 'hsl(var(--status-danger))' },
  ]

  const weeklyHoursData = [
    { day: 'Mon', hours: 8.5 },
    { day: 'Tue', hours: 7.2 },
    { day: 'Wed', hours: 9.1 },
    { day: 'Thu', hours: 6.8 },
    { day: 'Fri', hours: 8.0 },
    { day: 'Sat', hours: 3.5 },
    { day: 'Sun', hours: 2.0 },
  ]

  const projectProgressData = projects.slice(0, 5).map(project => ({
    name: project.name,
    progress: project.progress,
  }))

  const monthlyTrendData = [
    { month: 'Jan', projects: 12, hours: 180 },
    { month: 'Feb', projects: 15, hours: 220 },
    { month: 'Mar', projects: 18, hours: 250 },
    { month: 'Apr', projects: 14, hours: 200 },
    { month: 'May', projects: 20, hours: 280 },
    { month: 'Jun', projects: 22, hours: 300 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-engineering-red mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analysis</h1>
          <p className="text-muted-foreground">Project performance and analytics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((totalProjects / 20) * 100)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-status-active" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-active">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((activeProjects / totalProjects) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((totalHours / 160) * 100)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-engineering-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-engineering-red">{Math.round(avgProgress)}%</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((avgProgress / 100) * 100)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Status Distribution */}
        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Breakdown of projects by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Weekly Hours */}
        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Weekly Hours</CardTitle>
            <CardDescription>Hours logged this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              <BarChart data={weeklyHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="hsl(var(--engineering-red))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Top 5 projects by progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              <BarChart data={projectProgressData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="progress" fill="hsl(var(--engineering-red))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Projects and hours over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="projects"
                  stroke="hsl(var(--engineering-red))"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(var(--status-info))"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest project updates and time entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-status-active"></div>
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{project.status}</Badge>
                  <span className="text-sm text-muted-foreground">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analysis 