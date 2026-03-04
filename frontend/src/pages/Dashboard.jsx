import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, MessageSquare, Upload, Calendar, CreditCard, CheckSquare, Settings } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import ChatbotsTab from '@/components/tabs/ChatbotsTab';
import FilesTab from '@/components/tabs/FilesTab';
import ExamsTab from '@/components/tabs/ExamsTab';
import FlashcardsTab from '@/components/tabs/FlashcardsTab';
import ChecklistTab from '@/components/tabs/ChecklistTab';
import SubjectManager from '@/components/SubjectManager';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { SubjectsProvider } from '@/contexts/SubjectsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [activeTab, setActiveTab] = useState('chatbots');
  const [subjectManagerOpen, setSubjectManagerOpen] = useState(false);

  useEffect(() => {
    // Skip auth check if user data already passed from AuthCallback
    if (location.state?.user) return;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkAuth();
  }, [location.state, navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <LoadingProvider>
      <SubjectsProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PAU Study Master</h1>
              <p className="text-sm text-gray-600">Tu asistente de estudio inteligente</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                data-testid="manage-subjects-button"
                variant="outline"
                size="sm"
                onClick={() => setSubjectManagerOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Gestionar Asignaturas
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Avatar>
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <Button
                data-testid="logout-button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <SubjectManager
        open={subjectManagerOpen}
        onOpenChange={setSubjectManagerOpen}
        onSubjectsUpdated={() => {}}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white shadow-sm">
            <TabsTrigger
              data-testid="chatbots-tab"
              value="chatbots"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chatbots
            </TabsTrigger>
            <TabsTrigger
              data-testid="files-tab"
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Archivos
            </TabsTrigger>
            <TabsTrigger
              data-testid="exams-tab"
              value="exams"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger
              data-testid="flashcards-tab"
              value="flashcards"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger
              data-testid="checklist-tab"
              value="checklist"
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Checklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chatbots">
            <ChatbotsTab user={user} />
          </TabsContent>

          <TabsContent value="files">
            <FilesTab user={user} />
          </TabsContent>

          <TabsContent value="exams">
            <ExamsTab user={user} />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardsTab user={user} />
          </TabsContent>

          <TabsContent value="checklist">
            <ChecklistTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
        </div>
      </SubjectsProvider>
    </LoadingProvider>
  );
};

export default Dashboard;