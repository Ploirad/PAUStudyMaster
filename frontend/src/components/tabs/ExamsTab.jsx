import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useSubjects } from '@/contexts/SubjectsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function for fetch with timeout and better error handling
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La petición tardó demasiado. Verifica tu conexión.');
    }
    throw new Error('Error de conexión. Verifica que el servidor esté activo.');
  }
};

const ExamsTab = ({ user }) => {
  const { subjects } = useSubjects(); // Use shared context instead of local state
  const [exams, setExams] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    subject_name: '',
    title: '',
    date: '',
    time: '',
    notes: '',
    reminder: true
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetchWithTimeout(`${BACKEND_URL}/api/exams`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      } else {
        toast.error('Error al cargar exámenes');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error(error.message || 'Error de conexión');
    }
  };

  const handleSaveExam = async () => {
    if (!formData.subject_id || !formData.title || !formData.date) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    // Validate date is not in the past (unless editing existing exam)
    const today = new Date().toISOString().split('T')[0];
    if (formData.date < today && !editingExam) {
      toast.error('⚠️ La fecha del examen está en el pasado. ¿Estás seguro?', {
        duration: 5000,
        action: {
          label: 'Crear de todos modos',
          onClick: () => proceedWithSave()
        }
      });
      return;
    }

    await proceedWithSave();
  };

  const proceedWithSave = async () => {
    try {
      const url = editingExam
        ? `${BACKEND_URL}/api/exams/${editingExam.exam_id}`
        : `${BACKEND_URL}/api/exams`;
      const method = editingExam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchExams();
        setDialogOpen(false);
        resetForm();
        toast.success(editingExam ? 'Examen actualizado' : 'Examen creado');
      } else {
        toast.error('Error al guardar el examen');
      }
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error('Error de conexión');
    }
  };

  const handleDeleteExam = async (examId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/exams/${examId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchExams();
        toast.success('Examen eliminado');
      } else {
        toast.error('Error al eliminar el examen');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const openEditDialog = (exam) => {
    setEditingExam(exam);
    setFormData({
      subject_id: exam.subject_id,
      subject_name: exam.subject_name,
      title: exam.title,
      date: exam.date,
      time: exam.time || '',
      notes: exam.notes || '',
      reminder: exam.reminder
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingExam(null);
    setFormData({
      subject_id: '',
      subject_name: '',
      title: '',
      date: '',
      time: '',
      notes: '',
      reminder: true
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

  // Filter exams by selected month
  const filteredExams = exams.filter(exam => exam.date.startsWith(selectedMonth));

  // Generate calendar days
  const year = parseInt(selectedMonth.split('-')[0]);
  const month = parseInt(selectedMonth.split('-')[1]);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-600" />
            Agenda de Exámenes
          </CardTitle>
          <CardDescription>
            Calendario mensual editable con tus exámenes de PAU y evaluaciones de bachillerato
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Label htmlFor="month-select">Mes</Label>
              <Input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="max-w-xs"
                data-testid="month-selector"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="add-exam-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Examen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExam ? 'Editar Examen' : 'Nuevo Examen'}</DialogTitle>
                  <DialogDescription>
                    Añade detalles del examen. El chatbot padre usará esta información para planificar tu estudio.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Asignatura</Label>
                    <Select value={formData.subject_id} onValueChange={handleSubjectChange}>
                      <SelectTrigger data-testid="exam-subject-select">
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
                    <Label htmlFor="exam-title">Título del Examen</Label>
                    <Input
                      id="exam-title"
                      placeholder="Ej: Examen PAU Matemáticas"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      data-testid="exam-title-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exam-date">Fecha</Label>
                      <Input
                        id="exam-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        data-testid="exam-date-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam-time">Hora (opcional)</Label>
                      <Input
                        id="exam-time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="exam-notes">Notas (opcional)</Label>
                    <Textarea
                      id="exam-notes"
                      placeholder="Temas específicos, ubicación, etc."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveExam} data-testid="save-exam-button">
                    {editingExam ? 'Actualizar' : 'Crear'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }
              const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
              const dayExams = filteredExams.filter(exam => exam.date === dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                  }`}
                  data-testid={`calendar-day-${day}`}
                >
                  <div className="text-sm font-medium mb-1">{day}</div>
                  {dayExams.map((exam) => {
                    const subject = subjects.find(s => s.subject_id === exam.subject_id);
                    return (
                      <div
                        key={exam.exam_id}
                        className="text-xs bg-purple-100 rounded px-1 py-0.5 mb-1 truncate cursor-pointer hover:bg-purple-200"
                        onClick={() => openEditDialog(exam)}
                        data-testid="exam-item"
                        title={`${subject?.icon} ${exam.title}`}
                      >
                        {subject?.icon} {exam.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Exams List */}
          {filteredExams.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Exámenes del mes</h3>
              <div className="space-y-2">
                {filteredExams.sort((a, b) => a.date.localeCompare(b.date)).map((exam) => {
                  const subject = subjects.find(s => s.subject_id === exam.subject_id);
                  const subjectColor = subject?.color || '#9333EA';
                  return (
                    <div
                      key={exam.exam_id}
                      className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow"
                      style={{ borderLeftWidth: '4px', borderLeftColor: subjectColor }}
                      data-testid="exam-list-item"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{subject?.icon}</span>
                            <span className="font-semibold" style={{ color: subjectColor }}>{exam.title}</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(exam.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            {exam.time && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {exam.time}
                              </div>
                            )}
                            {exam.notes && (
                              <p className="text-gray-500 mt-1">{exam.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(exam)}
                            data-testid="edit-exam-button"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteExam(exam.exam_id)}
                            data-testid="delete-exam-button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamsTab;