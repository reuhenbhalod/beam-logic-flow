import { useState, useEffect, useMemo, useCallback } from 'react'
import { TrendingUp, Clock, DollarSign, Target, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartTooltip } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

  const fetchData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Memoized calculations for better performance
  const { totalProjects, activeProjects, completedProjects, totalHours, avgProgress } = useMemo(() => {
    const totalProjects = projects?.length || 0
    const activeProjects = projects?.filter(p => p.status === 'active')?.length || 0
    const completedProjects = projects?.filter(p => p.status === 'completed')?.length || 0
    const totalHours = timeEntries?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
    const avgProgress = projects?.length > 0 ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length : 0

    return { totalProjects, activeProjects, completedProjects, totalHours, avgProgress }
  }, [projects, timeEntries])

  // Generate chart data
  const projectStatusData = [
    { name: 'Active', value: activeProjects, color: 'hsl(var(--status-active))' },
    { name: 'Completed', value: completedProjects, color: 'hsl(var(--status-info))' },
    { name: 'Planning', value: projects?.filter(p => p.status === 'planning')?.length || 0, color: 'hsl(var(--status-warning))' },
    { name: 'On Hold', value: projects?.filter(p => p.status === 'on-hold')?.length || 0, color: 'hsl(var(--status-danger))' },
  ]

  // Generate project hours chart data
  const generateProjectHoursData = useCallback(() => {
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
      if (userHours[entry.user_id]?.[entry.project_id] !== undefined) {
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
  }, [selectedProject, timeEntries, users, projects])

  // Generate task type breakdown data
  const generateTaskTypeData = useCallback(() => {
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
  }, [timeEntries])

  const projectHoursData = useMemo(() => generateProjectHoursData(), [generateProjectHoursData])
  const taskTypeData = useMemo(() => generateTaskTypeData(), [generateTaskTypeData])

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-3xl border border-red-900/20 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/20 via-transparent to-red-800/10"></div>
          </div>
          <div className="relative z-10 px-8 py-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-3xl flex items-center justify-center shadow-2xl border border-red-600/30">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Analysis Dashboard</h1>
                <p className="text-red-200 text-xl font-medium">Unable to load project analytics</p>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="bg-gradient-to-br from-red-950 to-black border-red-800/30 rounded-3xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-red-200 text-2xl font-bold">Error Loading Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300 mb-6 text-lg">{error}</p>
            <button 
              onClick={fetchData}
              className="px-6 py-3 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              Retry Loading
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-3xl border border-red-900/20 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/20 via-transparent to-red-800/10"></div>
          </div>
          <div className="relative z-10 px-8 py-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-3xl flex items-center justify-center shadow-2xl border border-red-600/30">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Analysis Dashboard</h1>
                <p className="text-red-200 text-xl font-medium">Loading comprehensive analytics...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-800 border-t-white mx-auto shadow-lg"></div>
            <p className="mt-4 text-red-800 text-xl font-semibold">Loading analysis data...</p>
            <p className="text-gray-600 mt-1">Please wait while we process your project metrics</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-3xl border border-red-900/20 shadow-2xl overflow-hidden relative">
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/20 via-transparent to-red-800/10"></div>
          <div className="absolute top-4 right-4 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10 px-8 py-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-3xl flex items-center justify-center shadow-2xl border border-red-600/30">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Analysis Dashboard</h1>
              <p className="text-red-200 text-xl font-medium">Comprehensive project performance and analytics</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-red-300/80">
              <span className="font-semibold text-white">{projects.length}</span> projects analyzed across all metrics
            </div>
            <div className="flex items-center space-x-6">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-red-200 uppercase tracking-wider">Find Project</div>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-72 bg-black/40 border-red-800/50 hover:border-red-700 transition-all duration-300 shadow-lg backdrop-blur-sm text-white">
                    <SelectValue placeholder="Search and select a project..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-red-800/50 backdrop-blur-lg">
                    <SelectItem value="all" className="text-white hover:bg-red-900/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="font-medium">All Projects Overview</span>
                      </div>
                    </SelectItem>                      {projects.map(project => {
                        let statusColor = 'bg-red-300'
                        if (project.status === 'active') statusColor = 'bg-red-500'
                        else if (project.status === 'completed') statusColor = 'bg-red-400'
                        else if (project.status === 'on-hold') statusColor = 'bg-red-600'
                        
                        return (
                          <SelectItem key={project.id} value={project.id} className="text-white hover:bg-red-900/50">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                              <span className="font-medium">{project.name}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-red-200 uppercase tracking-wider">Time Range</div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40 bg-black/40 border-red-800/50 hover:border-red-700 transition-all duration-300 shadow-lg backdrop-blur-sm text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-red-800/50 backdrop-blur-lg">
                    <SelectItem value="week" className="text-white hover:bg-red-900/50">This Week</SelectItem>
                    <SelectItem value="month" className="text-white hover:bg-red-900/50">This Month</SelectItem>
                    <SelectItem value="quarter" className="text-white hover:bg-red-900/50">This Quarter</SelectItem>
                    <SelectItem value="year" className="text-white hover:bg-red-900/50">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Key Metrics */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-gray-50 border-red-900/20 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total Projects</CardTitle>
            <div className="w-12 h-12 bg-gradient-to-br from-red-800 to-red-900 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-black mb-3">{totalProjects}</div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-800 rounded-full shadow-sm"></div>
              <p className="text-sm text-gray-700 font-semibold">
                {activeProjects} currently active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950 to-black border-red-800/30 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-bold text-red-200 uppercase tracking-wider">Active Projects</CardTitle>
            <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <TrendingUp className="h-6 w-6 text-red-900" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-white mb-3">{activeProjects}</div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
              <p className="text-sm text-red-200 font-semibold">
                {totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}% of total projects
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-gray-50 border-red-900/20 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total Hours</CardTitle>
            <div className="w-12 h-12 bg-gradient-to-br from-red-800 to-red-900 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-black mb-3">{totalHours.toFixed(1)}</div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
              <p className="text-sm text-gray-700 font-semibold">
                Hours logged to date
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950 to-black border-red-800/30 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-bold text-red-200 uppercase tracking-wider">Avg Progress</CardTitle>
            <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <TrendingUp className="h-6 w-6 text-red-900" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-white mb-3">{Math.round(avgProgress)}%</div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
              <p className="text-sm text-red-200 font-semibold">
                Average completion rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Hours Chart */}
      <Card className="bg-gradient-to-br from-white to-gray-50 border-red-900/20 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-50"></div>
        <CardHeader className="pb-8 relative z-10">
          <CardTitle className="flex items-center gap-6 text-3xl font-bold text-black">
            <div className="w-16 h-16 bg-gradient-to-br from-red-800 to-red-950 rounded-3xl flex items-center justify-center shadow-2xl border border-red-700/20">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <div>Project Hours by Team Member</div>
              <div className="text-lg font-medium text-gray-600 mt-2">
                Hours distribution across {selectedProject === 'all' ? 'all projects' : projects.find(p => p.id === selectedProject)?.name}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {projectHoursData.length > 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-red-900/10">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={projectHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#374151"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Team Members', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 700 } }}
                  />
                  <YAxis 
                    stroke="#374151"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                    label={{ value: 'Hours Worked', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 700 } }}
                  />
                  <Tooltip 
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(153, 27, 27, 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontWeight: 600, color: '#374151' }} />
                  {projects.map((project, index) => {
                    let fillColor = '#7F1D1D'
                    if (index % 3 === 0) fillColor = '#991B1B'
                    else if (index % 3 === 1) fillColor = '#B91C1C'
                    
                    return (
                      <Bar 
                        key={project.id} 
                        dataKey={project.name} 
                        fill={fillColor}
                        stackId="a"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={80}
                      />
                    )
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-dashed border-red-300">
              <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-800 font-semibold text-lg">No time entries found</p>
              <p className="text-red-600 text-sm mt-1">for the selected project</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Type Breakdown */}
      <Card className="bg-gradient-to-br from-black to-red-950 border-red-800/30 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-700/10 to-transparent opacity-50"></div>
        <CardHeader className="pb-8 relative z-10">
          <CardTitle className="flex items-center gap-6 text-3xl font-bold text-white">
            <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-3xl flex items-center justify-center shadow-2xl border border-gray-300/20">
              <PieChartIcon className="h-8 w-8 text-red-900" />
            </div>
            <div>
              <div>Task Type Distribution</div>
              <div className="text-lg font-medium text-red-200 mt-2">
                Hours breakdown across different task categories
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {taskTypeData.length > 0 ? (
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-red-800/20">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={taskTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#000"
                    strokeWidth={2}
                  >
                    {taskTypeData.map((entry, index) => {
                      const colors = ['#991B1B', '#B91C1C', '#7F1D1D', '#DC2626', '#EF4444'];
                      return (
                        <Cell key={`task-${entry.name}-${index}`} fill={colors[index % colors.length]} />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-red-950/50 to-red-900/30 rounded-2xl border-2 border-dashed border-red-700/50">
              <div className="w-16 h-16 bg-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChartIcon className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-200 font-semibold text-lg">No task data available</p>
              <p className="text-red-400 text-sm mt-1">Start logging time entries to see distribution</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Spending Tracking */}
      <Card className="bg-gradient-to-br from-white to-gray-50 border-red-900/20 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-50"></div>
        <CardHeader className="pb-8 relative z-10">
          <CardTitle className="flex items-center gap-6 text-3xl font-bold text-black">
            <div className="w-16 h-16 bg-gradient-to-br from-red-800 to-red-950 rounded-3xl flex items-center justify-center shadow-2xl border border-red-700/20">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <div>Fee Spending vs Budget</div>
              <div className="text-lg font-medium text-gray-600 mt-2">
                Track financial performance against project budgets
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-6">
            {projects.filter(p => p.fee > 0 || p.budget > 0).map(project => {
              const projectHours = timeEntries
                .filter(entry => entry.project_id === project.id)
                .reduce((sum, entry) => sum + (entry.hours || 0), 0)
              
              const estimatedCost = projectHours * 100 // Assuming $100/hour average rate
              const feeSpent = (estimatedCost / project.fee) * 100
              const budgetSpent = (estimatedCost / project.budget) * 100
              
              return (
                <div key={project.id} className="bg-gradient-to-r from-white to-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-xl text-black">{project.name}</h4>
                    <div className="bg-red-800 text-white px-4 py-2 rounded-xl font-semibold shadow-sm">
                      {projectHours.toFixed(1)} hours
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/10 rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">Project Fee:</span>
                        <span className="font-bold text-black">${project.fee?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fee Status:</span>
                        <span className={`font-bold ${feeSpent > 100 ? 'text-red-800' : 'text-red-600'}`}>
                          {feeSpent > 100 ? 'Over Budget' : `${feeSpent.toFixed(1)}% spent`}
                        </span>
                      </div>
                    </div>
                    <div className="bg-black/10 rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">Project Budget:</span>
                        <span className="font-bold text-black">${project.budget?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Budget Status:</span>
                        <span className={`font-bold ${budgetSpent > 100 ? 'text-red-800' : 'text-red-600'}`}>
                          {budgetSpent > 100 ? 'Over Budget' : `${budgetSpent.toFixed(1)}% spent`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-semibold">
                        <span className="text-gray-600">Budget Progress</span>
                        <span className={budgetSpent > 100 ? 'text-red-800' : 'text-red-600'}>
                          {Math.min(budgetSpent, 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-3 shadow-inner">
                        <div 
                          className={`h-3 rounded-full shadow-sm transition-all duration-500 ${(() => {
                            if (budgetSpent > 100) return 'bg-gradient-to-r from-red-800 to-red-900'
                            if (budgetSpent > 75) return 'bg-gradient-to-r from-red-600 to-red-700'
                            return 'bg-gradient-to-r from-red-700 to-red-800'
                          })()}`}
                          style={{ width: `${Math.min(budgetSpent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task Budget Tracking */}
      <Card className="bg-gradient-to-br from-black to-red-950 border-red-800/30 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-700/10 to-transparent opacity-50"></div>
        <CardHeader className="pb-8 relative z-10">
          <CardTitle className="flex items-center gap-6 text-3xl font-bold text-white">
            <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-3xl flex items-center justify-center shadow-2xl border border-gray-300/20">
              <Target className="h-8 w-8 text-red-900" />
            </div>
            <div>
              <div>Task Budget Tracking</div>
              <div className="text-lg font-medium text-red-200 mt-2">
                Monitor costs and efficiency across task categories
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-6">
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
              
              return Object.entries(taskBreakdown).map(([role, data], index) => {
                const budget = sampleBudgets[role] || 2000
                const budgetSpent = (data.cost / budget) * 100
                
                return (
                  <div key={`${role}-${index}`} className="bg-gradient-to-r from-red-950/80 to-black/80 border-2 border-red-700/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-xl text-white">{role}</h4>
                      <div className="bg-white text-red-900 px-4 py-2 rounded-xl font-semibold shadow-sm">
                        {data.hours.toFixed(1)} hrs
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="text-sm text-red-200 mb-1">Cost</div>
                        <div className="text-xl font-bold text-white">${data.cost.toLocaleString()}</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="text-sm text-red-200 mb-1">Budget</div>
                        <div className="text-xl font-bold text-white">${budget.toLocaleString()}</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="text-sm text-red-200 mb-1">Status</div>
                        <div className={`text-lg font-bold ${budgetSpent > 100 ? 'text-red-400' : 'text-red-300'}`}>
                          {budgetSpent > 100 ? 'Over Budget' : `${budgetSpent.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2 font-semibold">
                        <span className="text-red-200">Budget Progress</span>
                        <span className={budgetSpent > 100 ? 'text-red-400' : 'text-red-300'}>
                          {Math.min(budgetSpent, 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-red-950/50 rounded-full h-3 shadow-inner border border-red-800/30">
                        <div 
                          className={`h-3 rounded-full shadow-sm transition-all duration-500 ${(() => {
                            if (budgetSpent > 100) return 'bg-gradient-to-r from-red-400 to-red-500'
                            if (budgetSpent > 75) return 'bg-gradient-to-r from-red-500 to-red-600'
                            return 'bg-gradient-to-r from-red-600 to-red-700'
                          })()}`}
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
      <Card className="bg-gradient-to-br from-white to-gray-50 border-red-900/20 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-50"></div>
        <CardHeader className="pb-8 relative z-10">
          <CardTitle className="flex items-center gap-6 text-3xl font-bold text-black">
            <div className="w-16 h-16 bg-gradient-to-br from-red-800 to-red-950 rounded-3xl flex items-center justify-center shadow-2xl border border-red-700/20">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <div>Project Status Overview</div>
              <div className="text-lg font-medium text-gray-600 mt-2">
                Current project status distribution across portfolio
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-red-900/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {projectStatusData.map((status, index) => {
                let gradientClass = 'bg-gradient-to-br from-red-900 to-black'
                if (status.name === 'Active') gradientClass = 'bg-gradient-to-br from-red-800 to-red-900'
                else if (status.name === 'Completed') gradientClass = 'bg-gradient-to-br from-red-600 to-red-700'
                else if (status.name === 'Planning') gradientClass = 'bg-gradient-to-br from-red-700 to-red-800'
                
                return (
                  <div key={`status-${status.name}-${index}`} className="text-center">
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-transform hover:scale-110 duration-300 ${gradientClass}`}>
                      <span className="text-2xl font-bold text-white">{status.value}</span>
                    </div>
                    <div className="font-bold text-lg text-black mb-1">{status.name}</div>
                    <div className="text-sm text-gray-600">
                      {totalProjects > 0 ? Math.round((status.value / totalProjects) * 100) : 0}% of total
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analysis 