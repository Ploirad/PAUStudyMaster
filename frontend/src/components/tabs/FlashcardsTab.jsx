import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Plus, RotateCw, X, Calendar, Filter, BookOpen, Edit2, Check, Trash2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSubjects } from '@/contexts/SubjectsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const PASSING_SCORE = 75;

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
    throw error;
  }
};

const FlashcardsTab = ({ user }) => {
  const { subjects } = useSubjects();
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [studySession, setStudySession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDue, setFilterDue] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checklistItems, setChecklistItems] = useState([]);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState('');
  const [hoveredDeck, setHoveredDeck] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deckToEdit, setDeckToEdit] = useState(null);
  const [editDeckData, setEditDeckData] = useState({
    subject_id: '',
    subject_name: '',
    topic: ''
  });
  const [formData, setFormData] = useState({
    subject_id: '',
    subject_name: '',
    topic: '',
    question: '',
    correct_answer: '',
    subsection_id: '',
    subsection_name: ''
  });

  useEffect(() => {
    fetchDecks();
  }, []);

  useEffect(() => {
    if (formData.subject_id) {
      fetchChecklistItems(formData.subject_id);
    }
  }, [formData.subject_id]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(`${BACKEND_URL}/api/flashcard-decks`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDecks(data);
      } else {
        toast.error('Error al cargar mazos');
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistItems = async (subjectId) => {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_URL}/api/checklists?subject_id=${subjectId}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setChecklistItems(data);
      }
    } catch (error) {
      console.error('Error fetching checklist items:', error);
    }
  };

  const handleCreateFlashcard = async () => {
    if (!formData.subject_id || !formData.question || !formData.correct_answer) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchDecks();
        setDialogOpen(false);
        resetForm();
        toast.success('¡Flashcard creada!');
      } else {
        toast.error('Error al crear flashcard');
      }
    } catch (error) {
      console.error('Error creating flashcard:', error);
      toast.error('Error de conexión');
    }
  };

  const handleUpdateAnswer = async (flashcardId, newAnswer) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/flashcards/${flashcardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          correct_answer: newAnswer
        })
      });

      if (response.ok) {
        const updatedCard = await response.json();
        
        // Update in study session
        setStudySession(prev => {
          const updatedFlashcards = prev.flashcards.map(fc =>
            fc.flashcard_id === flashcardId ? { ...fc, correct_answer: newAnswer } : fc
          );
          return { ...prev, flashcards: updatedFlashcards };
        });
        
        setIsEditingAnswer(false);
        toast.success('Respuesta actualizada');
      } else {
        toast.error('Error al actualizar respuesta');
      }
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast.error('Error de conexión');
    }
  };

  const handleGenerateFromResources = async () => {
    if (!formData.subject_id) {
      toast.error('Selecciona una asignatura');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/flashcards/generate-from-resources?subject_id=${formData.subject_id}&count=10`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        await fetchDecks();
        setDialogOpen(false);
        toast.success(`¡${data.count} flashcards generadas!`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al generar flashcards');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Error de conexión');
    }
  };

  const startStudySession = async (deck) => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(
        `${BACKEND_URL}/api/flashcard-decks/${deck.deck_id}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const flashcards = await response.json();
        setActiveDeck(deck);
        setStudySession({
          flashcards: flashcards,
          currentIndex: 0,
          masteredInSession: new Set(),
          failedCards: [],
          userAnswer: '',
          showAnswer: false,
          scoring: false
        });
      } else {
        toast.error('Error al cargar el mazo');
      }
    } catch (error) {
      console.error('Error starting study session:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!studySession.userAnswer.trim()) {
      toast.error('Escribe una respuesta');
      return;
    }

    const currentCard = studySession.flashcards[studySession.currentIndex];
    
    try {
      setStudySession(prev => ({ ...prev, scoring: true }));
      
      const response = await fetch(`${BACKEND_URL}/api/flashcards/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          flashcard_id: currentCard.flashcard_id,
          user_answer: studySession.userAnswer
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        const updatedCard = { ...currentCard, score: result.score, feedback: result.feedback };
        const updatedFlashcards = [...studySession.flashcards];
        updatedFlashcards[studySession.currentIndex] = updatedCard;
        
        if (result.score >= PASSING_SCORE) {
          setStudySession(prev => ({
            ...prev,
            masteredInSession: new Set([...prev.masteredInSession, currentCard.flashcard_id]),
            flashcards: updatedFlashcards,
            showAnswer: true,
            scoring: false
          }));
          toast.success(`¡Bien! ${result.score}% - ${result.feedback}`);
        } else {
          setStudySession(prev => ({
            ...prev,
            failedCards: [...prev.failedCards, updatedCard],
            flashcards: updatedFlashcards,
            showAnswer: true,
            scoring: false
          }));
          toast.error(`${result.score}% - ${result.feedback}. La volverás a ver.`);
        }
      } else {
        toast.error('Error al calificar');
        setStudySession(prev => ({ ...prev, scoring: false }));
      }
    } catch (error) {
      console.error('Error answering flashcard:', error);
      toast.error('Error de conexión');
      setStudySession(prev => ({ ...prev, scoring: false }));
    }
  };

  const handleNext = () => {
    const { currentIndex, flashcards, masteredInSession, failedCards } = studySession;
    
    if (currentIndex + 1 < flashcards.length) {
      setStudySession(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        userAnswer: '',
        showAnswer: false
      }));
      setIsEditingAnswer(false);
    } else if (failedCards.length > 0) {
      setStudySession(prev => ({
        ...prev,
        flashcards: [...prev.flashcards, ...prev.failedCards],
        failedCards: [],
        currentIndex: prev.currentIndex + 1,
        userAnswer: '',
        showAnswer: false
      }));
      setIsEditingAnswer(false);
      toast.info('Repasando las tarjetas que necesitan más práctica...');
    } else {
      toast.success(`¡Sesión completada! Dominaste ${masteredInSession.size} tarjetas.`);
      exitStudySession();
    }
  };

  const exitStudySession = () => {
    setStudySession(null);
    setActiveDeck(null);
    setIsEditingAnswer(false);
    fetchDecks();
  };

  const resetForm = () => {
    setFormData({
      subject_id: '',
      subject_name: '',
      topic: '',
      question: '',
      correct_answer: '',
      subsection_id: '',
      subsection_name: ''
    });
  };

  const handleEditDeck = (deck) => {
    setDeckToEdit(deck);
    setEditDeckData({
      subject_id: deck.subject_id,
      subject_name: deck.subject_name,
      topic: deck.topic
    });
    setEditDialogOpen(true);
  };

  const handleSaveEditDeck = async () => {
    if (!editDeckData.subject_id || !editDeckData.topic) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/flashcard-decks/${deckToEdit.deck_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editDeckData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Mazo actualizado correctamente');
        setEditDialogOpen(false);
        setDeckToEdit(null);
        await fetchDecks();
      } else {
        toast.error('Error al actualizar el mazo');
      }
    } catch (error) {
      console.error('Error updating deck:', error);
      toast.error('Error de conexión');
    }
  };

  const handleDeleteDeck = async (deck) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/flashcard-decks/${deck.deck_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Mazo eliminado correctamente');
        await fetchDecks();
      } else {
        toast.error('Error al eliminar el mazo');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast.error('Error de conexión');
    }
  };

  const filteredDecks = decks.filter(deck => {
    if (filterSubject !== 'all' && deck.subject_id !== filterSubject) return false;
    if (filterDue === 'due' && deck.due_count === 0) return false;
    if (searchQuery && !deck.topic.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedDecks = [...filteredDecks].sort((a, b) => {
    if (a.due_count > 0 && b.due_count === 0) return -1;
    if (a.due_count === 0 && b.due_count > 0) return 1;
    return a.days_until_review - b.days_until_review;
  });

  const getSubjectColor = (subjectId) => {
    const subject = subjects.find(s => s.subject_id === subjectId);
    return subject?.color || '#3B82F6';
  };

  // Get subsections for selected topic
  const getSubsectionsForTopic = () => {
    if (!formData.topic) return [];
    const item = checklistItems.find(item => item.topic === formData.topic);
    return item?.subsections || [];
  };

  // Render study session
  if (studySession) {
    const { flashcards, currentIndex, masteredInSession, userAnswer, showAnswer, scoring } = studySession;
    const currentCard = flashcards[currentIndex];
    const progress = ((currentIndex + 1) / flashcards.length) * 100;
    const masteredCount = masteredInSession.size;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={exitStudySession}
              className="rounded-full"
              data-testid="exit-study-session"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: getSubjectColor(activeDeck.subject_id) }}>
                {activeDeck.topic}
              </h2>
              <p className="text-sm text-gray-600">{activeDeck.subject_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Tarjeta {currentIndex + 1} de {flashcards.length}
            </p>
            <p className="text-sm font-medium text-green-600">
              Dominadas: {masteredCount}
            </p>
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2" />

        {/* Flashcard */}
        <Card className="border-2" style={{ borderColor: getSubjectColor(activeDeck.subject_id) }}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{currentCard.question}</CardTitle>
                {currentCard.subsection_name && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Subsección: <span className="font-medium">{currentCard.subsection_name}</span>
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showAnswer ? (
              <>
                <Textarea
                  placeholder="Escribe tu respuesta..."
                  value={userAnswer}
                  onChange={(e) => setStudySession(prev => ({ ...prev, userAnswer: e.target.value }))}
                  className="min-h-[120px]"
                  disabled={scoring}
                  data-testid="flashcard-answer-input"
                />
                <Button
                  onClick={handleAnswer}
                  disabled={scoring || !userAnswer.trim()}
                  className="w-full"
                  data-testid="submit-answer-button"
                >
                  {scoring ? 'Calificando...' : 'Comprobar Respuesta'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-blue-900">Respuesta correcta:</p>
                      {!isEditingAnswer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingAnswer(true);
                            setEditedAnswer(currentCard.correct_answer);
                          }}
                          className="h-8 text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                    {isEditingAnswer ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedAnswer}
                          onChange={(e) => setEditedAnswer(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateAnswer(currentCard.flashcard_id, editedAnswer)}
                            disabled={!editedAnswer.trim()}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingAnswer(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-blue-800">{currentCard.correct_answer}</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Tu respuesta:</p>
                    <p className="text-gray-800">{userAnswer}</p>
                  </div>
                  {currentCard.feedback && (
                    <div className={`p-4 rounded-lg ${currentCard.score >= PASSING_SCORE ? 'bg-green-50' : 'bg-orange-50'}`}>
                      <p className="text-sm font-medium mb-2">Retroalimentación:</p>
                      <p className="font-bold text-lg mb-1">Puntuación: {currentCard.score}%</p>
                      <p>{currentCard.feedback}</p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleNext}
                  className="w-full"
                  data-testid="next-card-button"
                  disabled={isEditingAnswer}
                >
                  {currentIndex + 1 < flashcards.length ? 'Siguiente Tarjeta' : 'Finalizar Sesión'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render deck selection
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mazos de Flashcards</h2>
          <p className="text-gray-600 mt-1">Estudia con repetición espaciada</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-flashcard-button">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Flashcard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Flashcard</DialogTitle>
              <DialogDescription>
                Crea una nueva flashcard o genera desde recursos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Asignatura *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => {
                    const subject = subjects.find(s => s.subject_id === value);
                    setFormData({
                      ...formData,
                      subject_id: value,
                      subject_name: subject?.name || '',
                      topic: '',
                      subsection_id: '',
                      subsection_name: ''
                    });
                  }}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Selecciona una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.subject_id} value={subject.subject_id}>
                        {subject.icon} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="topic">Tema *</Label>
                <Select
                  value={formData.topic}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      topic: value,
                      subsection_id: '',
                      subsection_name: ''
                    });
                  }}
                  disabled={!formData.subject_id}
                >
                  <SelectTrigger id="topic">
                    <SelectValue placeholder={formData.subject_id ? "Selecciona un tema" : "Primero selecciona asignatura"} />
                  </SelectTrigger>
                  <SelectContent>
                    {checklistItems.map(item => (
                      <SelectItem key={item.item_id} value={item.topic}>
                        {item.topic}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">+ Nuevo tema</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.topic === '__new__' && (
                  <Input
                    className="mt-2"
                    placeholder="Escribe el nuevo tema..."
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        setFormData({ ...formData, topic: e.target.value.trim() });
                      }
                    }}
                  />
                )}
              </div>

              {formData.topic && formData.topic !== '__new__' && getSubsectionsForTopic().length > 0 && (
                <div>
                  <Label htmlFor="subsection">Subsección (Opcional)</Label>
                  <Select
                    value={formData.subsection_id}
                    onValueChange={(value) => {
                      const subsections = getSubsectionsForTopic();
                      const subsection = subsections.find(s => s.subsection_id === value);
                      setFormData({
                        ...formData,
                        subsection_id: value,
                        subsection_name: subsection?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger id="subsection">
                      <SelectValue placeholder="Sin subsección" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin subsección</SelectItem>
                      {getSubsectionsForTopic().map(subsection => (
                        <SelectItem key={subsection.subsection_id} value={subsection.subsection_id}>
                          {subsection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Al dominar esta flashcard, la subsección se marcará como completada automáticamente
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="question">Pregunta *</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="¿Cuál es..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="answer">Respuesta Correcta *</Label>
                <Textarea
                  id="answer"
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  placeholder="La respuesta es..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateFromResources}
                disabled={!formData.subject_id}
                className="w-full sm:w-auto"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Generar desde Recursos
              </Button>
              <Button onClick={handleCreateFlashcard} className="w-full sm:w-auto">
                Crear Flashcard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter-subject" className="text-sm text-gray-600 mb-2 block">
                <Filter className="h-4 w-4 inline mr-1" />
                Filtrar por asignatura
              </Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger id="filter-subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las asignaturas</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id}>
                      {subject.icon} {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-due" className="text-sm text-gray-600 mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1" />
                Filtrar por repaso
              </Label>
              <Select value={filterDue} onValueChange={setFilterDue}>
                <SelectTrigger id="filter-due">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los mazos</SelectItem>
                  <SelectItem value="due">Solo para repasar hoy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search" className="text-sm text-gray-600 mb-2 block">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Buscar tema
              </Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por tema..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar mazo */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Mazo</DialogTitle>
            <DialogDescription>
              Modifica la asignatura o el tema de este mazo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-subject">Asignatura *</Label>
              <Select
                value={editDeckData.subject_id}
                onValueChange={(value) => {
                  const subject = subjects.find(s => s.subject_id === value);
                  setEditDeckData({
                    ...editDeckData,
                    subject_id: value,
                    subject_name: subject?.name || ''
                  });
                }}
              >
                <SelectTrigger id="edit-subject">
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id}>
                      {subject.icon} {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-topic">Tema *</Label>
              <Input
                id="edit-topic"
                value={editDeckData.topic}
                onChange={(e) => setEditDeckData({ ...editDeckData, topic: e.target.value })}
                placeholder="Nombre del tema"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditDeck}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decks Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando mazos...</p>
        </div>
      ) : sortedDecks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {decks.length === 0 ? 'No hay flashcards aún' : 'No se encontraron mazos'}
            </h3>
            <p className="text-gray-600 mb-6">
              {decks.length === 0 
                ? 'Crea tu primera flashcard o genera desde recursos'
                : 'Intenta con otros filtros de búsqueda'
              }
            </p>
            {decks.length === 0 && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Flashcard
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDecks.map(deck => (
            <Card
              key={deck.deck_id}
              className="relative group hover:shadow-xl transition-all border-l-4 overflow-hidden"
              style={{ borderLeftColor: getSubjectColor(deck.subject_id) }}
              onMouseEnter={() => setHoveredDeck(deck.deck_id)}
              onMouseLeave={() => setHoveredDeck(null)}
              data-testid={`deck-${deck.deck_id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg" style={{ color: getSubjectColor(deck.subject_id) }}>
                      {deck.topic}
                    </CardTitle>
                    <CardDescription>{deck.subject_name}</CardDescription>
                  </div>
                  {deck.due_count > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      ¡Repasar hoy!
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de tarjetas:</span>
                    <span className="font-medium">{deck.card_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Para repasar:</span>
                    <span className="font-medium text-orange-600">{deck.due_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dominadas:</span>
                    <span className="font-medium text-green-600">{deck.mastered_count}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Próximo repaso:</span>
                    <span className="font-medium">
                      {deck.days_until_review === 0
                        ? '¡Hoy!'
                        : `En ${deck.days_until_review} día${deck.days_until_review > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                </div>
                <Progress
                  value={(deck.mastered_count / deck.card_count) * 100}
                  className="h-2 mt-4"
                />
              </CardContent>
              {/* Overlay con botones al hacer hover */}
              {hoveredDeck === deck.deck_id && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-3 p-4 transition-all animate-in fade-in duration-200">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      startStudySession(deck);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    data-testid={`practice-deck-${deck.deck_id}`}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Practicar
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDeck(deck);
                    }}
                    variant="secondary"
                    className="flex-1"
                    data-testid={`edit-deck-${deck.deck_id}`}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        onClick={(e) => e.stopPropagation()}
                        variant="destructive"
                        className="flex-1"
                        data-testid={`delete-deck-${deck.deck_id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este mazo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente el mazo <strong>"{deck.topic}"</strong> de <strong>{deck.subject_name}</strong> y todas sus <strong>{deck.card_count} flashcards</strong>.
                          <br /><br />
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDeck(deck)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar Mazo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardsTab;
