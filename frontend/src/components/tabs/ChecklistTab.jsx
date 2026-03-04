import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, Plus, Lock, Trash2, AlertCircle, ChevronDown, ChevronRight, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSubjects } from '@/contexts/SubjectsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ChecklistTab = ({ user }) => {
  const { subjects } = useSubjects(); // Use shared context instead of local state
  const [checklistItems, setChecklistItems] = useState([]);
  const [filterSubject, setFilterSubject] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [editingSubsection, setEditingSubsection] = useState(null);
  const [editSubsectionName, setEditSubsectionName] = useState('');
  const [addingSubsectionTo, setAddingSubsectionTo] = useState(null);
  const [newSubsectionName, setNewSubsectionName] = useState('');
  const [formData, setFormData] = useState({
    subject_id: '',
    subject_name: '',
    topic: ''
  });

  useEffect(() => {
    fetchChecklistItems();
  }, []);

  const fetchChecklistItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/checklists`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setChecklistItems(data);
      }
    } catch (error) {
      console.error('Error fetching checklist items:', error);
    }
  };

  const handleCreateItem = async () => {
    if (!formData.subject_id || !formData.topic) {
      toast.error('Completa todos los campos');
      return;
    }

    // Check for duplicate topic names in the same subject (case-insensitive)
    const duplicateTopic = checklistItems.find(
      item => item.subject_id === formData.subject_id && 
              item.topic.toLowerCase() === formData.topic.toLowerCase()
    );
    
    if (duplicateTopic) {
      toast.error(`Ya existe el tema "${formData.topic}" en esta asignatura`);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchChecklistItems();
        setDialogOpen(false);
        resetForm();
        toast.success('Tema añadido al checklist');
      } else {
        toast.error('Error al crear item');
      }
    } catch (error) {
      console.error('Error creating checklist item:', error);
      toast.error('Error de conexión');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/checklists/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchChecklistItems();
        toast.success('Item eliminado');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleToggleSubsection = async (itemId, subsectionId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/checklists/${itemId}/subsections/${subsectionId}/toggle`,
        {
          method: 'PUT',
          credentials: 'include'
        }
      );

      if (response.ok) {
        await fetchChecklistItems();
      }
    } catch (error) {
      console.error('Error toggling subsection:', error);
      toast.error('Error al actualizar subsección');
    }
  };

  const handleAddSubsection = async (itemId) => {
    if (!newSubsectionName.trim()) {
      toast.error('Ingresa un nombre para la subsección');
      return;
    }

    // Check for duplicate subsection names in the same topic (case-insensitive)
    const currentItem = checklistItems.find(item => item.item_id === itemId);
    const duplicateSubsection = currentItem?.subsections?.find(
      subsection => subsection.name.toLowerCase() === newSubsectionName.trim().toLowerCase()
    );
    
    if (duplicateSubsection) {
      toast.error(`Ya existe la subsección "${newSubsectionName.trim()}" en este tema`);
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/checklists/${itemId}/subsections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ name: newSubsectionName })
        }
      );

      if (response.ok) {
        await fetchChecklistItems();
        setAddingSubsectionTo(null);
        setNewSubsectionName('');
        toast.success('Subsección añadida');
      }
    } catch (error) {
      console.error('Error adding subsection:', error);
      toast.error('Error al añadir subsección');
    }
  };

  const handleUpdateSubsection = async (itemId, subsectionId) => {
    if (!editSubsectionName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/checklists/${itemId}/subsections/${subsectionId}?name=${encodeURIComponent(editSubsectionName)}`,
        {
          method: 'PUT',
          credentials: 'include'
        }
      );

      if (response.ok) {
        await fetchChecklistItems();
        setEditingSubsection(null);
        setEditSubsectionName('');
        toast.success('Subsección actualizada');
      }
    } catch (error) {
      console.error('Error updating subsection:', error);
      toast.error('Error al actualizar subsección');
    }
  };

  const handleDeleteSubsection = async (itemId, subsectionId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/checklists/${itemId}/subsections/${subsectionId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        await fetchChecklistItems();
        toast.success('Subsección eliminada');
      }
    } catch (error) {
      console.error('Error deleting subsection:', error);
      toast.error('Error al eliminar subsección');
    }
  };

  const resetForm = () => {
    setFormData({
      subject_id: '',
      subject_name: '',
      topic: ''
    });
  };

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find(s => s.subject_id === subjectId);
    setFormData({
      ...formData,
      subject_id: subjectId,
      subject_name: subject?.name || ''
    });
  };

  const filteredItems = filterSubject === 'all'
    ? checklistItems
    : checklistItems.filter(item => item.subject_id === filterSubject);

  const groupedItems = subjects.map(subject => ({
    subject,
    items: filteredItems.filter(item => item.subject_id === subject.subject_id)
  })).filter(group => group.items.length > 0);

  // Calculate overall progress
  const calculateProgress = () => {
    let totalSubsections = 0;
    let completedSubsections = 0;

    checklistItems.forEach(item => {
      const subsections = item.subsections || [];
      totalSubsections += subsections.length;
      completedSubsections += subsections.filter(s => s.is_completed).length;
    });

    return {
      total: totalSubsections,
      completed: completedSubsections,
      percentage: totalSubsections > 0 ? (completedSubsections / totalSubsections) * 100 : 0
    };
  };

  // Calculate subject progress
  const calculateSubjectProgress = (subjectItems) => {
    let totalSubsections = 0;
    let completedSubsections = 0;

    subjectItems.forEach(item => {
      const subsections = item.subsections || [];
      totalSubsections += subsections.length;
      completedSubsections += subsections.filter(s => s.is_completed).length;
    });

    return {
      total: totalSubsections,
      completed: completedSubsections,
      percentage: totalSubsections > 0 ? (completedSubsections / totalSubsections) * 100 : 0
    };
  };

  // Calculate topic progress
  const calculateTopicProgress = (item) => {
    const subsections = item.subsections || [];
    const total = subsections.length;
    const completed = subsections.filter(s => s.is_completed).length;
    return {
      total,
      completed,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  };

  const overallProgress = calculateProgress();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-green-600" />
            Checklist de Contenidos
          </CardTitle>
          <CardDescription>
            Lista interactiva de temas y subsecciones con seguimiento de progreso detallado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">Progreso General</span>
                <span className="text-2xl font-bold text-green-600">
                  {overallProgress.completed} / {overallProgress.total}
                </span>
              </div>
              <Progress value={overallProgress.percentage} className="h-4 mb-2" />
              <p className="text-sm text-gray-600">
                {Math.round(overallProgress.percentage)}% de subsecciones completadas
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Sistema de Subsecciones Inteligente</p>
                <p className="text-xs text-blue-700 mt-1">
                  • Los temarios subidos generan automáticamente subsecciones con IA<br/>
                  • Puedes añadir, editar o eliminar subsecciones manualmente<br/>
                  • <strong>✨ Nuevo:</strong> Las subsecciones se completan automáticamente al responder correctamente flashcards con el mismo tema (≥75%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Label>Filtrar por Asignatura</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[200px]" data-testid="checklist-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id}>
                      {subject.icon} {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="add-checklist-item-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Tema
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Tema al Checklist</DialogTitle>
                  <DialogDescription>
                    Añade temas manualmente. Los temarios subidos generan temas y subsecciones automáticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Asignatura</Label>
                    <Select value={formData.subject_id} onValueChange={handleSubjectChange}>
                      <SelectTrigger data-testid="checklist-subject-select">
                        <SelectValue placeholder="Selecciona asignatura" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.subject_id} value={subject.subject_id}>
                            {subject.icon} {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="topic-input">Tema</Label>
                    <Input
                      id="topic-input"
                      placeholder="Ej: Matrices"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      data-testid="checklist-topic-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateItem} data-testid="save-checklist-item-button">
                    Añadir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No hay temas en el checklist</p>
              <p className="text-sm text-gray-500 mt-2">
                Sube temarios en la sección Archivos o añádelos manualmente
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedItems.map(({ subject, items }) => {
                const subjectProgress = calculateSubjectProgress(items);
                return (
                  <div key={subject.subject_id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{subject.icon}</span>
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      <div className="flex items-center gap-2 ml-auto">
                        <Progress value={subjectProgress.percentage} className="w-24 h-2" />
                        <span className="text-sm text-gray-600">
                          {Math.round(subjectProgress.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const topicProgress = calculateTopicProgress(item);
                        const isExpanded = expandedItems[item.item_id];
                        const hasSubsections = item.subsections && item.subsections.length > 0;

                        return (
                          <div
                            key={item.item_id}
                            className="border rounded-lg transition-all bg-white"
                            data-testid="checklist-item"
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <button
                                    onClick={() => toggleExpanded(item.item_id)}
                                    className="mt-1 text-gray-500 hover:text-gray-700"
                                    data-testid="expand-topic-button"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900">
                                        {item.topic}
                                      </p>
                                    </div>

                                    <div className="mt-2 flex items-center gap-2">
                                      <Progress value={topicProgress.percentage} className="h-2 flex-1 max-w-xs" />
                                      <span className="text-xs font-medium text-gray-600">
                                        {topicProgress.completed}/{topicProgress.total} ({Math.round(topicProgress.percentage)}%)
                                      </span>
                                    </div>

                                    {!hasSubsections && (
                                      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                                        <p className="text-xs text-yellow-800">
                                          💡 Sin subsecciones. Expande este tema para añadirlas manualmente o sube un temario para generarlas con IA.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(item.item_id)}
                                  data-testid="delete-checklist-item-button"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                </Button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t bg-gray-50 p-4">
                                <div className="space-y-2">
                                  {hasSubsections && (
                                    <>
                                      {item.subsections.map((subsection) => (
                                        <div
                                          key={subsection.subsection_id}
                                          className="flex items-center gap-3 bg-white p-3 rounded border"
                                          data-testid="subsection-item"
                                        >
                                          <Checkbox
                                            checked={subsection.is_completed}
                                            onCheckedChange={() => handleToggleSubsection(item.item_id, subsection.subsection_id)}
                                            data-testid="subsection-checkbox"
                                          />
                                          {editingSubsection === subsection.subsection_id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                              <Input
                                                value={editSubsectionName}
                                                onChange={(e) => setEditSubsectionName(e.target.value)}
                                                className="flex-1"
                                                data-testid="edit-subsection-input"
                                                autoFocus
                                              />
                                              <Button
                                                size="sm"
                                                onClick={() => handleUpdateSubsection(item.item_id, subsection.subsection_id)}
                                                data-testid="save-subsection-button"
                                              >
                                                <Check className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setEditingSubsection(null);
                                                  setEditSubsectionName('');
                                                }}
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <>
                                              <span className={`flex-1 text-sm ${subsection.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                {subsection.name}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setEditingSubsection(subsection.subsection_id);
                                                  setEditSubsectionName(subsection.name);
                                                }}
                                                data-testid="edit-subsection-button"
                                              >
                                                <Edit2 className="h-4 w-4 text-gray-400" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteSubsection(item.item_id, subsection.subsection_id)}
                                                data-testid="delete-subsection-button"
                                              >
                                                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </>
                                  )}

                                  {!hasSubsections && (
                                    <div className="text-center py-4 bg-white border border-dashed rounded-lg">
                                      <p className="text-sm text-gray-500 mb-2">
                                        Este tema no tiene subsecciones todavía
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        Añade subsecciones manualmente o sube un temario
                                      </p>
                                    </div>
                                  )}

                                  {addingSubsectionTo === item.item_id ? (
                                    <div className="flex items-center gap-2 mt-3">
                                      <Input
                                        value={newSubsectionName}
                                        onChange={(e) => setNewSubsectionName(e.target.value)}
                                        placeholder="Nombre de la subsección"
                                        className="flex-1"
                                        data-testid="new-subsection-input"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddSubsection(item.item_id)}
                                        data-testid="save-new-subsection-button"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setAddingSubsectionTo(null);
                                          setNewSubsectionName('');
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full mt-2"
                                      onClick={() => setAddingSubsectionTo(item.item_id)}
                                      data-testid="add-subsection-button"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Añadir Subsección
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChecklistTab;
