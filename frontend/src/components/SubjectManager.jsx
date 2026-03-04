import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useSubjects } from '@/contexts/SubjectsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PREDEFINED_SUBJECTS = [
  { name: 'Matemáticas', icon: '📐', color: '#3B82F6' },
  { name: 'Física', icon: '⚛️', color: '#8B5CF6' },
  { name: 'Filosofía', icon: '🤔', color: '#F59E0B' },
  { name: 'Inglés', icon: '🇬🇧', color: '#10B981' },
  { name: 'Geografía', icon: '🌍', color: '#06B6D4' }
];

const SubjectManager = ({ open, onOpenChange, onSubjectsUpdated }) => {
  const { subjects, refreshSubjects } = useSubjects(); // Use shared context
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📚',
    color: '#3B82F6'
  });

  useEffect(() => {
    if (open) {
      refreshSubjects();
    }
  }, [open]);

  const handleSaveSubject = async () => {
    if (!formData.name) {
      toast.error('El nombre es obligatorio');
      return;
    }
    // Check for duplicate subject names (case-insensitive)
    const duplicateSubject = subjects.find(
      s => s.name.toLowerCase() === formData.name.toLowerCase() && 
           (!editingSubject || s.subject_id !== editingSubject.subject_id)
    );
    
    if (duplicateSubject) {
      toast.error(`Ya existe una asignatura con el nombre "${formData.name}"`);
      return;
    }

    try {
      const url = editingSubject
        ? `${BACKEND_URL}/api/subjects/${editingSubject.subject_id}`
        : `${BACKEND_URL}/api/subjects`;
      const method = editingSubject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        refreshSubjects(); // Refresh from context
        setAddDialogOpen(false);
        resetForm();
        toast.success(editingSubject ? 'Asignatura actualizada' : 'Asignatura creada');
        if (onSubjectsUpdated) onSubjectsUpdated();
      } else {
        toast.error('Error al guardar la asignatura');
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      toast.error('Error de conexión');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subjects/${subjectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        refreshSubjects(); // Refresh from context
        toast.success('Asignatura eliminada');
        if (onSubjectsUpdated) onSubjectsUpdated();
      } else {
        toast.error('Error al eliminar la asignatura');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const handleAddPredefined = async (subject) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(subject)
      });

      if (response.ok) {
        refreshSubjects(); // Refresh from context
        toast.success(`${subject.name} añadida`);
        if (onSubjectsUpdated) onSubjectsUpdated();
      }
    } catch (error) {
      console.error('Error adding predefined subject:', error);
    }
  };

  const openEditDialog = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      icon: subject.icon,
      color: subject.color
    });
    setAddDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      icon: '📚',
      color: '#3B82F6'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Gestión de Asignaturas
          </DialogTitle>
          <DialogDescription>
            Añade, edita o elimina asignaturas. También puedes usar las predefinidas para la PAU.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Predefined Subjects */}
          {subjects.length === 0 && (
            <div>
              <h3 className="font-semibold mb-3">Asignaturas Predefinidas</h3>
              <div className="grid grid-cols-2 gap-2">
                {PREDEFINED_SUBJECTS.map((subject) => (
                  <Button
                    key={subject.name}
                    variant="outline"
                    onClick={() => handleAddPredefined(subject)}
                    className="justify-start"
                  >
                    <span className="text-xl mr-2">{subject.icon}</span>
                    {subject.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Current Subjects */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Mis Asignaturas</h3>
              <Dialog open={addDialogOpen} onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="add-subject-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Asignatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSubject ? 'Editar Asignatura' : 'Nueva Asignatura'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject-name">Nombre</Label>
                      <Input
                        id="subject-name"
                        placeholder="Ej: Historia de España"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        data-testid="subject-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject-icon">Icono (emoji)</Label>
                      <Input
                        id="subject-icon"
                        placeholder="📚"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject-color">Color</Label>
                      <Input
                        id="subject-color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveSubject} data-testid="save-subject-button">
                      {editingSubject ? 'Actualizar' : 'Crear'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {subjects.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No tienes asignaturas. Añade algunas predefinidas o crea las tuyas.
              </p>
            ) : (
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <Card key={subject.subject_id} data-testid="subject-item">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{subject.icon}</span>
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(subject.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSubject(subject.subject_id)}
                          data-testid="delete-subject-button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectManager;
