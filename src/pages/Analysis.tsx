import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Clock, DollarSign, Users, Target, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [timeRange, selectedProject])

  const fetchData = async () => {
    try {
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

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')

      if (usersError) {
        console.error('Users error:', usersError)
        // Don't throw error for users, just log it
      }

      setProjects(projectsData || [])
      setTimeEntries(timeData || [])
      setUsers(usersData || [])
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

  // Generate project hours chart data
  const generateProjectHoursData = () => {
    if (!timeEntries.length || !users.length) return []

    const filteredEntries = selectedProject === 'all' 
      ? timeEntries 
      : timeEntries.filter(entry => entry.project_id === selectedProject)

    const userHours: { [key: string]: { [key: string]: number } } = {}
    
    // Initialize user hours for each project
    users.forEach(user => {
      userHours[user.id] = {}
      projects.forEach(project => {
        userHours[user.id][project.id] = 0
      })
    })

    // Calculate hours for each user on each project
    filteredEntries.forEach(entry => {
      if (userHours[entry.user_id] && userHours[entry.user_id][entry.project_id] !== undefined) {
        userHours[entry.user_id][entry.project_id] += entry.hours || 0
      }
    })

    // Convert to chart format
    const chartData = users.map(user => {
      const userData: any = { name: user.full_name }
      projects.forEach(project => {
        userData[project.name] = userHours[user.id][project.id] || 0
      })
      return userData
    })

    return chartData
  }

  // Generate task type breakdown data
  const generateTaskTypeData = () => {
    if (!timeEntries.length) return []

    const taskBreakdown: { [key: string]: number } = {}
    
    timeEntries.forEach(entry => {
      const role = entry.role || 'Unknown'
      taskBreakdown[role] = (taskBreakdown[role] || 0) + (entry.hours || 0)
    })

    return Object.entries(taskBreakdown).map(([role, hours]) => ({
      name: role,
      value: hours,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }))
  }

  const projectHoursData = generateProjectHoursData()
  const taskTypeData = generateTaskTypeData()

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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Analysis</h1>
              <p className="text-slate-600 text-lg font-medium">Project performance and analytics</p>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="text-slate-500">
            <span className="font-medium">{projects.length}</span> projects analyzed
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 bg-white border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-white border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
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
        </div>
      </div>



      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="engineering-card hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Projects</CardTitle>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <Target className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800 mb-2">{totalProjects}</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-slate-600 font-medium">
                {activeProjects} active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="engineering-card hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Projects</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">{activeProjects}</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-slate-600 font-medium">
                {totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="engineering-card hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Hours</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800 mb-2">{totalHours.toFixed(1)}</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-slate-600 font-medium">
                Hours logged
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="engineering-card hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Avg Progress</CardTitle>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600 mb-2">{Math.round(avgProgress)}%</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p className="text-sm text-slate-600 font-medium">
                Across all projects
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Hours Chart */}
      <Card className="engineering-card hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-2xl font-bold text-slate-800">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <div>Project Hours by Person</div>
              <div className="text-base font-normal text-slate-500 mt-1">
                Hours worked by each person on {selectedProject === 'all' ? 'all projects' : projects.find(p => p.id === selectedProject)?.name}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectHoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={projectHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {projects.map((project, index) => (
                  <Bar 
                    key={project.id} 
                    dataKey={project.name} 
                    fill={`hsl(${index * 60}, 70%, 50%)`}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No time entries found for the selected project
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Type Breakdown */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Task Type Breakdown
          </CardTitle>
          <CardDescription>Hours spent on different types of tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {taskTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={taskTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No task type data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Spending Tracking */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Spending vs Budget
          </CardTitle>
          <CardDescription>Track how much of your project fees have been spent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.filter(p => p.fee > 0 || p.budget > 0).map(project => {
              const projectHours = timeEntries
                .filter(entry => entry.project_id === project.id)
                .reduce((sum, entry) => sum + (entry.hours || 0), 0)
              
              const estimatedCost = projectHours * 100 // Assuming $100/hour average rate
              const feeSpent = (estimatedCost / project.fee) * 100
              const budgetSpent = (estimatedCost / project.budget) * 100
              
              return (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{project.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      {projectHours.toFixed(1)} hours
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fee: ${project.fee?.toLocaleString() || '0'}</span>
                      <span className={feeSpent > 100 ? 'text-red-600' : 'text-green-600'}>
                        {feeSpent > 100 ? 'Over Budget' : `${feeSpent.toFixed(1)}% spent`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Budget: ${project.budget?.toLocaleString() || '0'}</span>
                      <span className={budgetSpent > 100 ? 'text-red-600' : 'text-green-600'}>
                        {budgetSpent > 100 ? 'Over Budget' : `${budgetSpent.toFixed(1)}% spent`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${budgetSpent > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(budgetSpent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task Budget Tracking */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Task Budget Tracking
          </CardTitle>
          <CardDescription>Track time and costs against different task types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const taskBreakdown: { [key: string]: { hours: number; cost: number; budget: number } } = {}
              
              // Calculate hours and costs for each task type
              timeEntries.forEach(entry => {
                const role = entry.role || 'Unknown'
                if (!taskBreakdown[role]) {
                  taskBreakdown[role] = { hours: 0, cost: 0, budget: 0 }
                }
                taskBreakdown[role].hours += entry.hours || 0
                taskBreakdown[role].cost += (entry.hours || 0) * 100 // $100/hour rate
              })
              
              // Set sample budgets for different task types
              const sampleBudgets: { [key: string]: number } = {
                'Engineering': 5000,
                'Drafting': 3000,
                'Project Management': 4000,
                'Consulting': 6000,
                'Unknown': 2000
              }
              
              return Object.entries(taskBreakdown).map(([role, data]) => {
                const budget = sampleBudgets[role] || 2000
                const budgetSpent = (data.cost / budget) * 100
                
                return (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{role}</h4>
                      <div className="text-sm text-muted-foreground">
                        {data.hours.toFixed(1)} hours
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cost: ${data.cost.toLocaleString()}</span>
                        <span>Budget: ${budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Budget Status:</span>
                        <span className={budgetSpent > 100 ? 'text-red-600' : 'text-green-600'}>
                          {budgetSpent > 100 ? 'Over Budget' : `${budgetSpent.toFixed(1)}% spent`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${budgetSpent > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(budgetSpent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Project Status Distribution */}
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