import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Calendar, User, Clock, AlertTriangle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-status-active'
    case 'completed': return 'bg-status-info'
    case 'on-hold': return 'bg-status-warning'
    default: return 'bg-status-warning'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Active'
    case 'completed': return 'Completed'
    case 'on-hold': return 'On Hold'
    case 'planning': return 'Planning'
    default: return status
  }
}

// ProjectCard component
const ProjectCard = ({ project, onEdit, onDelete, hasTimeEntries }: { 
  project: Project, 
  onEdit: (project: Project) => void, 
  onDelete: (id: string) => void,
  hasTimeEntries: boolean 
}) => {
  return (
    <Card className="engineering-card hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-red-700 transition-colors">{project.name}</CardTitle>
            <CardDescription className="mt-3 line-clamp-2 text-slate-600 text-base leading-relaxed">
              {project.description}
            </CardDescription>
          </div>
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl"
              onClick={() => onEdit(project)}
              data-interactive
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl"
              onClick={() => onDelete(project.id)}
              data-interactive
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(project.status)} px-4 py-2 rounded-full font-semibold shadow-sm text-sm`}>
              {getStatusText(project.status)}
            </Badge>
            {hasTimeEntries && (
              <div className="flex items-center text-amber-600 bg-amber-50 p-2 rounded-full shadow-sm" title="This project has time entries logged">
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="text-right">
                               <div className="text-2xl font-bold text-red-800">{project.progress}%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Complete</div>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Progress</span>
              <span className="font-semibold text-slate-700">{project.progress}%</span>
            </div>
            <div className="relative">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-700 to-red-800 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div className="flex items-center space-x-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
            <Calendar className="h-5 w-5 text-red-800" />
            <span className="font-medium">{new Date(project.start_date || project.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
            <Clock className="h-5 w-5 text-red-800" />
            <span className="font-medium">{project.project_type || 'No Type'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 shadow-sm">
            <div className="text-xs text-slate-600 mb-2 font-medium uppercase tracking-wide">Project Fee</div>
            <div className="font-bold text-red-800 text-xl">${project.fee?.toLocaleString() || '0'}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm">
            <div className="text-xs text-slate-600 mb-2 font-medium uppercase tracking-wide">Budget</div>
            <div className="font-bold text-blue-700 text-xl">${project.budget?.toLocaleString() || '0'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectsWithTimeEntries, setProjectsWithTimeEntries] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    progress: 0,
    project_type: '',
    fee: 0,
    start_date: '',
    end_date: '',
    budget: 0
  })

  const { user } = useAuth()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])

      // Check which projects have time entries
      const { data: timeEntriesData } = await supabase
        .from('time_entries')
        .select('project_id')

      if (timeEntriesData) {
        const projectIdsWithTimeEntries = new Set(timeEntriesData.map(entry => entry.project_id))
        setProjectsWithTimeEntries(projectIdsWithTimeEntries)
      }
    } catch (err) {
      setError('Failed to fetch projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase
        .from('projects')
        .insert([
          {
            ...formData,
            created_by: user.id,
            progress: Number(formData.progress)
          }
        ])

      if (error) throw error

      setIsCreateDialogOpen(false)
      setFormData({ name: '', description: '', status: 'planning', progress: 0 })
      fetchProjects()
    } catch (err) {
      setError('Failed to create project')
      console.error('Error creating project:', err)
    }
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...formData,
          progress: Number(formData.progress)
        })
        .eq('id', editingProject.id)

      if (error) throw error

      setIsEditDialogOpen(false)
      setEditingProject(null)
      setFormData({ name: '', description: '', status: 'planning', progress: 0 })
      fetchProjects()
    } catch (err) {
      setError('Failed to update project')
      console.error('Error updating project:', err)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated time entries.')) return

    try {
      // First, delete all associated time entries
      const { error: timeEntriesError } = await supabase
        .from('time_entries')
        .delete()
        .eq('project_id', projectId)

      if (timeEntriesError) {
        console.error('Error deleting time entries:', timeEntriesError)
        // Continue anyway, as the project might not have time entries
      }

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      fetchProjects()
    } catch (err) {
      setError('Failed to delete project. Make sure you have permission to delete this project.')
      console.error('Error deleting project:', err)
    }
  }

  const openEditDialog = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      project_type: project.project_type || '',
      fee: project.fee || 0,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget || 0
    })
    setIsEditDialogOpen(true)
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-engineering-red mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-red-100 px-8 py-6 border-b border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Projects</h1>
              <p className="text-slate-600 text-lg font-medium">Manage your engineering projects</p>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="text-slate-500">
            <span className="font-medium">{projects.length}</span> total projects
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-800 hover:bg-red-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-base font-bold rounded-2xl">
                <Plus className="h-6 w-6 mr-3" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-bold text-slate-800">Create New Project</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Add a new project to your portfolio
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter project description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="drafting">Drafting</SelectItem>
                      <SelectItem value="pm">Project Management</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fee">Project Fee ($)</Label>
                    <Input
                      id="fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Project Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                    Create Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-status-danger">
          <AlertDescription className="text-status-danger">{error}</AlertDescription>
        </Alert>
      )}

      {/* Projects Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
          <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 font-medium">All Projects</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 font-medium">Active</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 font-medium">Completed</TabsTrigger>
          <TabsTrigger value="planning" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 font-medium">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={openEditDialog} onDelete={handleDeleteProject} hasTimeEntries={projectsWithTimeEntries.has(project.id)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.filter(p => p.status === 'active').map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={openEditDialog} onDelete={handleDeleteProject} hasTimeEntries={projectsWithTimeEntries.has(project.id)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.filter(p => p.status === 'completed').map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={openEditDialog} onDelete={handleDeleteProject} hasTimeEntries={projectsWithTimeEntries.has(project.id)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.filter(p => p.status === 'planning').map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={openEditDialog} onDelete={handleDeleteProject} hasTimeEntries={projectsWithTimeEntries.has(project.id)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">Edit Project</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update project details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-progress">Progress (%)</Label>
              <Input
                id="edit-progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project_type">Project Type</Label>
              <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="drafting">Drafting</SelectItem>
                  <SelectItem value="pm">Project Management</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fee">Project Fee ($)</Label>
                <Input
                  id="edit-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-budget">Project Budget ($)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start_date">Start Date</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end_date">End Date (Optional)</Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                Update Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Projects 