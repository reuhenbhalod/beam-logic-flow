import { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Clock, TrendingUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type TimeEntry = Database['public']['Tables']['time_entries']['Row']

const Reports = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('all')
  const [dateRange, setDateRange] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')
  // const { user } = useAuth() // Currently unused but may be needed for user-specific reports

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')

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

  const generateReport = (type: string) => {
    // Generate CSV data
    const csvData = projects.map(project => {
      const projectHours = timeEntries
        .filter(entry => entry.project_id === project.id)
        .reduce((sum, entry) => sum + (entry.hours || 0), 0)

      const projectCost = projectHours * 100 // Assuming $100/hour average rate

      return [
        project.name,
        project.status,
        `${project.progress}%`,
        `${projectHours.toFixed(1)} hrs`,
        `$${projectCost.toFixed(2)}`,
        project.project_type || 'N/A',
        `$${project.fee?.toLocaleString() || '0'}`,
        `$${project.budget?.toLocaleString() || '0'}`
      ]
    })

    if (type === 'csv') {
      const csvContent = [
        ['Project Name', 'Status', 'Progress', 'Hours', 'Cost', 'Type', 'Fee', 'Budget'],
        ...csvData
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'projects_report.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } else if (type === 'pdf') {
      // Create a simple text-based PDF content
      const pdfContent = projects.map(project => {
        const projectHours = timeEntries
          .filter(entry => entry.project_id === project.id)
          .reduce((sum, entry) => sum + (entry.hours || 0), 0)

        return [
          `Project: ${project.name}`,
          `  Status: ${project.status}`,
          `  Progress: ${project.progress}%`,
          `  Hours: ${projectHours.toFixed(1)}`,
          `  Type: ${project.project_type || 'N/A'}`,
          `  Fee: $${project.fee?.toLocaleString() || '0'}`,
          `  Budget: $${project.budget?.toLocaleString() || '0'}`,
          ''
        ].join('\n')
      }).join('\n')

      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'projects_report.txt'
      a.click()
      window.URL.revokeObjectURL(url)
    }
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
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Reports</h1>
                <p className="text-red-200 text-xl font-medium">Loading report data...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-800 border-t-white mx-auto shadow-lg"></div>
            <p className="mt-4 text-red-800 text-xl font-semibold">Loading reports...</p>
            <p className="text-gray-600 mt-1">Please wait while we generate your data</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="modern-card">
        <div className="bg-gradient-to-r from-red-950/50 to-red-900/30 px-8 py-6 border-b border-red-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Reports</h1>
              <p className="text-gray-400 text-lg font-medium">Generate and download project reports</p>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="text-gray-400">
            <span className="font-medium text-white">{projects.length}</span> projects available
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => generateReport('csv')}
              className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport('pdf')}
              className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={() => fetchData()}
              className="modern-btn-primary"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Search Projects</Label>
              <Input
                placeholder="Search by project name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all" className="text-white">All Projects</SelectItem>
                  <SelectItem value="active" className="text-white">Active Projects</SelectItem>
                  <SelectItem value="completed" className="text-white">Completed Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="week" className="text-white">This Week</SelectItem>
                  <SelectItem value="month" className="text-white">This Month</SelectItem>
                  <SelectItem value="quarter" className="text-white">This Quarter</SelectItem>
                  <SelectItem value="year" className="text-white">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="text-white">Project Overview</CardTitle>
          <CardDescription className="text-gray-400">
            Detailed breakdown of all projects and their metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Project</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Progress</TableHead>
                  <TableHead className="text-gray-300">Hours</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Fee</TableHead>
                  <TableHead className="text-gray-300">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const projectHours = timeEntries
                    .filter(entry => entry.project_id === project.id)
                    .reduce((sum, entry) => sum + (entry.hours || 0), 0)

                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'active': return 'bg-green-900/20 text-green-400 border-green-400/20'
                      case 'completed': return 'bg-blue-900/20 text-blue-400 border-blue-400/20'
                      case 'on-hold': return 'bg-yellow-900/20 text-yellow-400 border-yellow-400/20'
                      default: return 'bg-gray-900/20 text-gray-400 border-gray-400/20'
                    }
                  }

                  return (
                    <TableRow key={project.id} className="border-gray-700 hover:bg-red-950/20">
                      <TableCell className="font-medium text-white">{project.name}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(project.status)} border`}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={project.progress} className="w-16 h-2" />
                          <span className="text-gray-300 text-sm">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{projectHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-gray-300">{project.project_type || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">${project.fee?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-gray-300">${project.budget?.toLocaleString() || '0'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{projects.length}</div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {projects.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Progress</CardTitle>
            <Calendar className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {projects.length > 0 
                ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Reports
