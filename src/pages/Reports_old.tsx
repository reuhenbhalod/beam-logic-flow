import { useState, useEffect } from 'react'
import { Download, FileText, Calendar, Clock, TrendingUp, Filter } from 'lucide-react'
import { Button } from '@/compon  if (loading) {
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
  }tton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
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
  const { user } = useAuth()

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
    let data: any
    let filename: string
    let contentType: string

    switch (type) {
      case 'csv':
        data = generateCSV()
        filename = `project-report-${new Date().toISOString().split('T')[0]}.csv`
        contentType = 'text/csv'
        break
      case 'pdf':
        // For now, generate a formatted text report that can be printed as PDF
        data = generatePDFReport()
        filename = `project-report-${new Date().toISOString().split('T')[0]}.txt`
        contentType = 'text/plain'
        break
      case 'email':
        generateEmailReport()
        return
      default:
        data = {
          projects,
          timeEntries,
          generatedAt: new Date().toISOString(),
          user: user?.email,
        }
        filename = `${type}-report-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
    }

    const blob = new Blob([data], { type: contentType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateCSV = () => {
    const headers = ['Project Name', 'Client', 'Type', 'Fee', 'Hours', 'Cost', 'Margin', 'Status', 'Progress']
    const rows = projects.map(project => {
      const projectHours = timeEntries
        .filter(entry => entry.project_id === project.id)
        .reduce((sum, entry) => sum + entry.hours, 0)
      const projectCost = projectHours * (project.target_hourly_rate || 0)
      const margin = (project.fee || 0) - projectCost
      
      return [
        project.name,
        project.client_name || 'N/A',
        project.project_type || 'N/A',
        project.fee || 0,
        projectHours,
        projectCost.toFixed(2),
        margin.toFixed(2),
        project.status,
        project.progress
      ].join(',')
    })
    
    return [headers.join(','), ...rows].join('\n')
  }

  const generatePDFReport = () => {
    const report = [
      'PROJECT MANAGEMENT REPORT',
      'Generated: ' + new Date().toLocaleDateString(),
      'User: ' + (user?.email || 'Unknown'),
      '',
      'PROJECT SUMMARY:',
      'Total Projects: ' + projects.length,
      'Active Projects: ' + projects.filter(p => p.status === 'active').length,
      'Total Hours: ' + timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
      'Total Fees: $' + projects.reduce((sum, p) => sum + (p.fee || 0), 0).toLocaleString(),
      '',
      'PROJECT DETAILS:',
      ...projects.map(project => {
        const projectHours = timeEntries
          .filter(entry => entry.project_id === project.id)
          .reduce((sum, entry) => sum + entry.hours, 0)
        return [
          '  ' + project.name,
          '    Client: ' + (project.client_name || 'N/A'),
          '    Fee: $' + (project.fee || 0).toLocaleString(),
          '    Hours: ' + projectHours,
          '    Progress: ' + project.progress + '%',
          '    Status: ' + project.status,
          ''
        ].join('\n')
      })
    ].join('\n')
    
    return report
  }

  const generateEmailReport = () => {
    const subject = encodeURIComponent('Project Management Report - ' + new Date().toLocaleDateString())
    const body = encodeURIComponent(generatePDFReport())
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`
    window.open(mailtoLink)
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const avgProgress = projects.length > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-engineering-red mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate and download project reports</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => generateReport('csv')}
            className="border-engineering-red text-engineering-red hover:bg-engineering-red hover:text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => generateReport('pdf')}
            className="border-engineering-red text-engineering-red hover:bg-engineering-red hover:text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => generateReport('email')}
            className="border-engineering-red text-engineering-red hover:bg-engineering-red hover:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Email Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search Projects</Label>
              <Input
                id="search"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                  <SelectItem value="planning">Planning Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredProjects.filter(p => p.status === 'active').length} active
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
              {Math.round(totalHours / 8)} work days
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

        <Card className="engineering-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.length > 0 ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Projects completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Detailed view of all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge className={
                      project.status === 'active' ? 'bg-status-active' :
                      project.status === 'completed' ? 'bg-status-info' :
                      project.status === 'on-hold' ? 'bg-status-danger' :
                      'bg-status-warning'
                    }>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={project.progress} className="w-20" />
                      <span className="text-sm">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(project.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateReport(`project-${project.id}`)}
                      data-interactive
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Time Entries Summary */}
      <Card className="engineering-card">
        <CardHeader>
          <CardTitle>Time Entries Summary</CardTitle>
          <CardDescription>Recent time tracking entries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.slice(0, 10).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {projects.find(p => p.id === entry.project_id)?.name || 'Unknown Project'}
                  </TableCell>
                  <TableCell>{entry.hours}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Project Status Report</CardTitle>
            <CardDescription>Breakdown by project status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {['active', 'completed', 'planning', 'on-hold'].map((status) => {
              const count = projects.filter(p => p.status === status).length
              const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'active' ? 'bg-status-active' :
                      status === 'completed' ? 'bg-status-info' :
                      status === 'on-hold' ? 'bg-status-danger' :
                      'bg-status-warning'
                    }`}></div>
                    <span className="capitalize">{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-sm text-muted-foreground">({Math.round(percentage)}%)</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="engineering-card">
          <CardHeader>
            <CardTitle>Time Tracking Summary</CardTitle>
            <CardDescription>Hours by project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.slice(0, 5).map((project) => {
              const projectHours = timeEntries
                .filter(entry => entry.project_id === project.id)
                .reduce((sum, entry) => sum + entry.hours, 0)
              return (
                <div key={project.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{project.name}</span>
                  <span className="text-sm text-muted-foreground">{projectHours}h</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Reports 