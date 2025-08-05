import { useState, useEffect } from 'react'
import { Clock, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']

const TimeLogger = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    project_id: '',
    hours: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
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
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('time_entries')
        .insert([
          {
            ...formData,
            user_id: user.id,
            hours: Number(formData.hours)
          }
        ])

      if (error) throw error

      setSuccess('Time entry logged successfully!')
      setFormData({
        project_id: '',
        hours: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      
      setTimeout(() => {
        setIsOpen(false)
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError('Failed to log time entry')
      console.error('Error logging time entry:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-engineering-red text-engineering-red hover:bg-engineering-red hover:text-white"
          data-interactive
        >
          <Clock className="h-4 w-4 mr-2" />
          Log Time
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Time Entry</DialogTitle>
          <DialogDescription>
            Record time spent on a project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select 
              value={formData.project_id} 
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              placeholder="Enter hours worked"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you work on?"
              required
            />
          </div>

          {error && (
            <Alert className="border-status-danger">
              <AlertDescription className="text-status-danger">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-status-active">
              <AlertDescription className="text-status-active">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-engineering-red hover:bg-engineering-red-dark"
              disabled={loading || !formData.project_id}
            >
              {loading ? 'Logging...' : 'Log Time'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TimeLogger 