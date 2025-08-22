import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, User, Building, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Person = Database['public']['Tables']['people']['Row']
type Project = Database['public']['Tables']['projects']['Row']

const People = () => {
  const [people, setPeople] = useState<Person[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    hourly_rate: 0,
    notes: ''
  })

  const { user } = useAuth()

  useEffect(() => {
    fetchPeople()
    fetchProjects()
  }, [])

  const fetchPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setPeople(data || [])
    } catch (err) {
      setError('Failed to fetch people')
      console.error('Error fetching people:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase
        .from('people')
        .insert([
          {
            ...formData,
            hourly_rate: Number(formData.hourly_rate),
            created_by: user.id
          }
        ])

      if (error) throw error

      setIsCreateDialogOpen(false)
      setFormData({ name: '', email: '', phone: '', role: '', department: '', hourly_rate: 0, notes: '' })
      fetchPeople()
    } catch (err) {
      setError('Failed to create person')
      console.error('Error creating person:', err)
    }
  }

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPerson) return

    try {
      const { error } = await supabase
        .from('people')
        .update({
          ...formData,
          hourly_rate: Number(formData.hourly_rate)
        })
        .eq('id', editingPerson.id)

      if (error) throw error

      setIsEditDialogOpen(false)
      setEditingPerson(null)
      fetchPeople()
    } catch (err) {
      setError('Failed to update person')
      console.error('Error updating person:', err)
    }
  }

  const handleDeletePerson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this person? This will also remove them from all projects.')) return

    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPeople()
    } catch (err) {
      setError('Failed to delete person')
      console.error('Error deleting person:', err)
    }
  }

  const openEditDialog = (person: Person) => {
    setEditingPerson(person)
    setFormData({
      name: person.name,
      email: person.email || '',
      phone: person.phone || '',
      role: person.role || '',
      department: person.department || '',
      hourly_rate: person.hourly_rate || 0,
      notes: person.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'engineer': return 'bg-blue-100 text-blue-700'
      case 'architect': return 'bg-purple-100 text-purple-700'
      case 'project manager': return 'bg-green-100 text-green-700'
      case 'drafter': return 'bg-yellow-100 text-yellow-700'
      case 'consultant': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-slate-500">Loading people...</p>
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
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">People</h1>
              <p className="text-slate-600 text-lg font-medium">Manage your team members and their roles</p>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="text-slate-500">
            <span className="font-medium">{people.length}</span> team members
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-base font-bold rounded-2xl">
                <Plus className="h-6 w-6 mr-3" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-bold text-slate-800">Add New Team Member</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Add a new person to your team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePerson} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineer">Engineer</SelectItem>
                        <SelectItem value="Architect">Architect</SelectItem>
                        <SelectItem value="Project Manager">Project Manager</SelectItem>
                        <SelectItem value="Drafter">Drafter</SelectItem>
                        <SelectItem value="Consultant">Consultant</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Structural, Civil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this person"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add Person
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* People Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => (
          <Card key={person.id} className="engineering-card hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    {person.name}
                  </CardTitle>
                  {person.role && (
                    <Badge className={`${getRoleColor(person.role)} px-3 py-1 rounded-full font-medium shadow-sm text-sm mt-2`}>
                      {person.role}
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-xl"
                    onClick={() => openEditDialog(person)}
                    data-interactive
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl"
                    onClick={() => handleDeletePerson(person.id)}
                    data-interactive
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {person.department && (
                <div className="flex items-center space-x-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{person.department}</span>
                </div>
              )}
              
              {person.email && (
                <div className="flex items-center space-x-3 text-slate-600">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{person.email}</span>
                </div>
              )}
              
              {person.phone && (
                <div className="flex items-center space-x-3 text-slate-600">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{person.phone}</span>
                </div>
              )}
              
              {person.hourly_rate && person.hourly_rate > 0 && (
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm">
                  <div className="text-xs text-slate-600 mb-2 font-medium uppercase tracking-wide">Hourly Rate</div>
                  <div className="font-bold text-green-700 text-xl">${person.hourly_rate}/hr</div>
                </div>
              )}
              
              {person.notes && (
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <div className="font-medium text-slate-700 mb-1">Notes:</div>
                  {person.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">Edit Team Member</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update team member details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePerson} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineer">Engineer</SelectItem>
                    <SelectItem value="Architect">Architect</SelectItem>
                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                    <SelectItem value="Drafter">Drafter</SelectItem>
                    <SelectItem value="Consultant">Consultant</SelectItem>
                    <SelectItem value="Intern">Intern</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Structural, Civil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="edit-hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this person"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Update Person
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default People 