import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Upload, FileText, Calendar as CalendarIcon, Loader2, BookOpen, Sparkles, Trash2, ChevronDown, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useSubjects } from '@/contexts/SubjectsContext';
import { useLoading } from '@/contexts/LoadingContext';

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

const FilesTab = ({ user }) => {
  const { subjects } = useSubjects(); // Use shared context
  const { showLoading, hideLoading } = useLoading(); // Use loading context
  const [schedule, setSchedule] = useState(null);
  const [syllabi, setSyllabi] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedResourceSubject, setSelectedResourceSubject] = useState('');
  const [selectedCsvSubject, setSelectedCsvSubject] = useState('');
  const [csvTopic, setCsvTopic] = useState('');
  const [uploadingSchedule, setUploadingSchedule] = useState(false);
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [selectedResourceForGenerate, setSelectedResourceForGenerate] = useState(null);

  useEffect(() => {
    fetchSchedule();
    fetchSyllabi();
    fetchResources();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await fetchWithTimeout(`${BACKEND_URL}/api/files/schedule`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else if (response.status !== 404) {
        toast.error('Error al cargar horario');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error(error.message || 'Error de conexión');
    }
  };

  const fetchSyllabi = async () => {
    try {
      const response = await fetchWithTimeout(`${BACKEND_URL}/api/files/syllabi`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSyllabi(data);
      } else {
        toast.error('Error al cargar temarios');
      }
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      toast.error(error.message || 'Error de conexión');
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetchWithTimeout(`${BACKEND_URL}/api/files/resources`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      } else {
        toast.error('Error al cargar recursos');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error(error.message || 'Error de conexión');
    }
  };

  const uploadSchedule = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast.error('Solo se aceptan archivos PDF');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    setUploadingSchedule(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/files/upload-schedule`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
        toast.success('¡Horario subido exitosamente!');
      } else {
        toast.error('Error al subir el horario');
      }
    } catch (error) {
      console.error('Error uploading schedule:', error);
      toast.error('Error de conexión');
    } finally {
      setUploadingSchedule(false);
    }
  };

  const uploadSyllabus = async (file) => {
    if (!file || !selectedSubject) {
      toast.error('Selecciona una asignatura primero');
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      toast.error('Solo se aceptan archivos PDF');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    setUploadingSyllabus(true);
    showLoading('Subiendo y analizando temario con IA...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/files/upload-syllabus`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'subject-id': selectedSubject
        },
        body: formData
      });

      if (response.ok) {
        await fetchSyllabi();
        toast.success('¡Temario subido y analizado con IA!');
        setSelectedSubject('');
      } else {
        toast.error('Error al subir el temario');
      }
    } catch (error) {
      console.error('Error uploading syllabus:', error);
      toast.error('Error de conexión');
    } finally {
      setUploadingSyllabus(false);
      hideLoading();
    }
  };

  const uploadResource = async (file) => {
    if (!file || !selectedResourceSubject) {
      toast.error('Selecciona una asignatura primero');
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      toast.error('Solo se aceptan archivos PDF');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    setUploadingResource(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/files/upload-resource`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'subject-id': selectedResourceSubject
        },
        body: formData
      });

      if (response.ok) {
        await fetchResources();
        toast.success('¡Recurso subido y analizado con IA!');
        setSelectedResourceSubject('');
      } else {
        toast.error('Error al subir el recurso');
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Error de conexión');
    } finally {
      setUploadingResource(false);
    }
  };

  const deleteResource = async (resourceId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/files/resources/${resourceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchResources();
        toast.success('Recurso eliminado');
      } else {
        toast.error('Error al eliminar el recurso');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Error de conexión');
    }
  };

  const uploadCsvFlashcards = async (file) => {
    if (!file || !selectedCsvSubject || !csvTopic.trim()) {
      toast.error('Selecciona una asignatura y escribe el nombre del tema');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      toast.error('Solo se aceptan archivos CSV');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Tamaño máximo: 5MB');
      return;
    }

    setUploadingCsv(true);
    showLoading('Importando flashcards desde CSV...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/flashcards/import-csv`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'subject-id': selectedCsvSubject,
          'topic': csvTopic.trim()
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedCsvSubject('');
        setCsvTopic('');
        // Clear file input
        document.getElementById('csv-upload').value = '';
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al importar flashcards');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Error de conexión');
    } finally {
      setUploadingCsv(false);
      hideLoading();
    }
  };
  
  const openGenerateDialog = (subjectId) => {
    setSelectedResourceForGenerate(subjectId);
    setFlashcardCount(5);
    setGenerateDialogOpen(true);
  };

  const generateFlashcardsFromResources = async () => {
    if (!selectedResourceForGenerate) return;

    setGeneratingFlashcards(true);
    showLoading(`Generando ${flashcardCount} flashcards con IA...`);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/flashcards/generate-from-resources?subject_id=${selectedResourceForGenerate}&count=${flashcardCount}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`¡${data.count} flashcards generadas exitosamente!`);
        setGenerateDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al generar flashcards');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Error de conexión');
    } finally {
      setGeneratingFlashcards(false);
      hideLoading();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-green-600" />
            Gestión de Archivos
          </CardTitle>
          <CardDescription>
            Sube tu horario diario y temarios por asignatura. La IA analizará el contenido automáticamente.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Sección 1: Horario Diario
          </CardTitle>
          <CardDescription>
            Sube tu horario completo (PDF) para que el chatbot padre calcule tus horas disponibles de estudio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="schedule-upload">Archivo de Horario (PDF)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="schedule-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadSchedule(file);
                }}
                disabled={uploadingSchedule}
                data-testid="schedule-upload-input"
              />
            </div>
          </div>

          {uploadingSchedule && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analizando horario...</span>
            </div>
          )}

          {schedule && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="schedule-uploaded">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Horario subido</span>
              </div>
              <p className="text-sm text-gray-700">Archivo: {schedule.file_name}</p>
              <p className="text-xs text-gray-500 mt-1">
                Subido el {new Date(schedule.uploaded_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Syllabus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Sección 2: Temarios por Asignatura
          </CardTitle>
          <CardDescription>
            Sube temarios (PDF) y la IA extraerá temas automáticamente para generar flashcards y checklists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject-select">Asignatura</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger data-testid="subject-select">
                <SelectValue placeholder="Selecciona una asignatura" />
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
            <Label htmlFor="syllabus-upload">Archivo de Temario (PDF)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="syllabus-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadSyllabus(file);
                }}
                disabled={uploadingSyllabus || !selectedSubject}
                data-testid="syllabus-upload-input"
              />
            </div>
          </div>

          {uploadingSyllabus && (
            <div className="flex items-center gap-2 text-purple-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analizando temario con IA...</span>
            </div>
          )}

          {syllabi.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Temarios subidos:</p>
              {syllabi.map((syllabus) => {
                const subject = subjects.find(s => s.subject_id === syllabus.subject_id);
                return (
                  <div
                    key={syllabus.syllabus_id}
                    className="bg-purple-50 border border-purple-200 rounded-lg p-3"
                    data-testid="syllabus-item"
                  >
                    <div className="flex items-center gap-2">
                      <span>{subject?.icon}</span>
                      <span className="font-medium text-purple-900">{subject?.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">Archivo: {syllabus.file_name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {syllabus.topics.length} temas extraídos
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import CSV Flashcards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Sección 2.5: Importar Flashcards desde CSV
          </CardTitle>
          <CardDescription>
            Importa flashcards masivamente desde un archivo CSV. El archivo debe tener el formato: question,correct_answer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-900 mb-2">📋 Formato del CSV:</p>
            <pre className="text-xs bg-white p-3 rounded border border-indigo-300 overflow-x-auto">
{`question,correct_answer
"¿Qué es la fotosíntesis?","Proceso por el cual las plantas convierten luz en energía"
"¿Capital de España?","Madrid"`}
            </pre>
            <p className="text-xs text-indigo-700 mt-2">
              💡 Tip: Asegúrate de que el CSV esté en formato UTF-8 y use comas como separador.
            </p>
          </div>

          <div>
            <Label htmlFor="csv-subject-select">Asignatura</Label>
            <Select value={selectedCsvSubject} onValueChange={setSelectedCsvSubject}>
              <SelectTrigger data-testid="csv-subject-select">
                <SelectValue placeholder="Selecciona una asignatura" />
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
            <Label htmlFor="csv-topic">Tema/Mazo</Label>
            <Input
              id="csv-topic"
              type="text"
              placeholder="Ej: Tema 1 - Introducción, Gramática Básica, etc."
              value={csvTopic}
              onChange={(e) => setCsvTopic(e.target.value)}
              disabled={!selectedCsvSubject}
              data-testid="csv-topic-input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si el tema ya existe, las flashcards se agregarán a ese mazo. Si no, se creará uno nuevo.
            </p>
          </div>

          <div>
            <Label htmlFor="csv-upload">Archivo CSV</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadCsvFlashcards(file);
                }}
                disabled={uploadingCsv || !selectedCsvSubject || !csvTopic.trim()}
                data-testid="csv-upload-input"
              />
            </div>
          </div>

          {uploadingCsv && (
            <div className="flex items-center gap-2 text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Importando flashcards desde CSV...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-600" />
            Sección 3: Recursos de Estudio
          </CardTitle>
          <CardDescription>
            Sube recursos educativos (PDF) por asignatura. La IA extraerá ejercicios y preguntas para generar flashcards manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="resource-subject-select">Asignatura</Label>
            <Select value={selectedResourceSubject} onValueChange={setSelectedResourceSubject}>
              <SelectTrigger data-testid="resource-subject-select">
                <SelectValue placeholder="Selecciona una asignatura" />
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
            <Label htmlFor="resource-upload">Archivo de Recurso (PDF)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="resource-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadResource(file);
                }}
                disabled={uploadingResource || !selectedResourceSubject}
                data-testid="resource-upload-input"
              />
            </div>
          </div>

          {uploadingResource && (
            <div className="flex items-center gap-2 text-orange-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analizando recurso con IA...</span>
            </div>
          )}

          {resources.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium text-sm">Recursos subidos:</p>
              <Accordion type="multiple" className="w-full space-y-2">
                {subjects.map((subject) => {
                  const subjectResources = resources.filter(r => r.subject_id === subject.subject_id);
                  if (subjectResources.length === 0) return null;

                  const totalQuestions = subjectResources.reduce((sum, r) => sum + (r.extracted_questions?.length || 0), 0);

                  return (
                    <AccordionItem 
                      key={subject.subject_id} 
                      value={subject.subject_id}
                      className="border rounded-lg overflow-hidden"
                      style={{ 
                        background: `linear-gradient(to bottom, white 0%, ${subject.color}20 100%)`,
                        borderColor: subject.color
                      }}
                    >
                      <AccordionTrigger 
                        className="px-4 hover:no-underline"
                        data-testid={`accordion-trigger-${subject.subject_id}`}
                      >
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{subject.icon}</span>
                            <div className="text-left">
                              <span className="font-semibold text-gray-900">{subject.name}</span>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {subjectResources.length} archivo{subjectResources.length !== 1 ? 's' : ''} • {totalQuestions} preguntas
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGenerateDialog(subject.subject_id);
                            }}
                            disabled={totalQuestions === 0}
                            style={{ 
                              backgroundColor: subject.color,
                              opacity: totalQuestions === 0 ? 0.5 : 1
                            }}
                            className="hover:opacity-90 text-white"
                            data-testid={`generate-flashcards-${subject.subject_id}`}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generar Flashcards
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2 mt-2">
                          {subjectResources.map((resource) => (
                            <div
                              key={resource.resource_id}
                              className="bg-white rounded-md p-3 flex items-start justify-between shadow-sm border"
                              data-testid="resource-item"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{resource.file_name}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {resource.extracted_questions?.length || 0} preguntas extraídas
                                </p>
                                <p className="text-xs text-gray-500">
                                  Subido el {new Date(resource.uploaded_at).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteResource(resource.resource_id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`delete-resource-${resource.resource_id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Flashcards Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent data-testid="generate-flashcards-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              Generar Flashcards desde Recursos
            </DialogTitle>
            <DialogDescription>
              ¿Cuántas flashcards quieres generar a partir de los recursos de esta asignatura?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="flashcard-count">Cantidad de Flashcards</Label>
            <Input
              id="flashcard-count"
              type="number"
              min="1"
              max="50"
              value={flashcardCount}
              onChange={(e) => setFlashcardCount(parseInt(e.target.value) || 1)}
              className="mt-2"
              data-testid="flashcard-count-input"
            />
            <p className="text-xs text-gray-500 mt-2">
              Las flashcards se generarán aleatoriamente desde las preguntas extraídas de tus recursos.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
              disabled={generatingFlashcards}
            >
              Cancelar
            </Button>
            <Button
              onClick={generateFlashcardsFromResources}
              disabled={generatingFlashcards}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="confirm-generate-flashcards"
            >
              {generatingFlashcards ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilesTab;