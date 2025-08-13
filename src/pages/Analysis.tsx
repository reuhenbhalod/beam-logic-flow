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
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('month')
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      console.log('Fetching data...')
      setError(null)
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')

      if (projectsError) {
        console.error('Projects error:', projectsError)
        throw new Error(`Failed to fetch projects: ${projectsError.message}`)
      }

      // Fetch time entries
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select('*')

      if (timeError) {
        console.error('Time entries error:', timeError)
        throw new Error(`Failed to fetch time entries: ${timeError.message}`)
      }

      console.log('Projects data:', projectsData)
      console.log('Time entries data:', timeData)

      setProjects(projectsData || [])
      setTimeEntries(timeData || [])
    } catch (err) {
      console.error('Error in fetchData:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Safe calculations with error handling
  const totalProjects = projects?.length || 0
  const activeProjects = projects?.filter(p => p.status === 'active')?.length || 0
  const completedProjects = projects?.filter(p => p.status === 'completed')?.length || 0
  const totalHours = timeEntries?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
  const avgProgress = projects?.length > 0 ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length : 0
  
  // Safe financial calculations
  const totalFees = projects?.reduce((sum, p) => sum + (Number(p.fee) || 0), 0) || 0
  const totalCost = timeEntries?.reduce((sum, entry) => {
    const project = projects?.find(p => p.id === entry.project_id)
    const hourlyRate = Number(project?.target_hourly_rate) || 0
    return sum + ((entry.hours || 0) * hourlyRate)
  }, 0) || 0
  
  const grossMargin = totalFees - totalCost
  const profitMargin = totalFees > 0 ? (grossMargin / totalFees) * 100 : 0
  const effectiveHourlyRate = totalHours > 0 ? totalFees / totalHours : 0

  // Generate chart data
  const projectStatusData = [
    { name: 'Active', value: activeProjects, color: 'hsl(var(--status-active))' },
    { name: 'Completed', value: completedProjects, color: 'hsl(var(--status-info))' },
    { name: 'Planning', value: projects?.filter(p => p.status === 'planning')?.length || 0, color: 'hsl(var(--status-warning))' },
    { name: 'On Hold', value: projects?.filter(p => p.status === 'on-hold')?.length || 0, color: 'hsl(var(--status-danger))' },
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

  const projectProgressData = projects?.slice(0, 5).map(project => ({
    name: project.name,
    progress: project.progress || 0,
  })) || []

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis</h1>
            <p className="text-muted-foreground">Project performance and analytics</p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis</h1>
            <p className="text-muted-foreground">Project performance and analytics</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-engineering-red mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analysis...</p>
          </div>
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

      {/* Debug Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">
            Projects: {totalProjects} | Time Entries: {timeEntries?.length || 0} | 
            Total Hours: {totalHours} | Total Fees: ${totalFees}
          </p>
        </CardContent>
      </Card>

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
              {activeProjects} active
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
              {totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Hours logged
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
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simple Chart */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle>Project Status Distribution</CardTitle>
          <CardDescription>Current project status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {projectStatusData.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{status.name}</span>
                <span className="text-sm text-muted-foreground">{status.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analysis 