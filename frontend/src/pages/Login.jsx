import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Brain, Calendar, CheckSquare, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">PAU Study Master</h1>
          <p className="text-xl text-gray-600">Tu asistente inteligente para aprobar la PAU con éxito</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Chatbots Inteligentes
              </CardTitle>
              <CardDescription>
                Planes de estudio personalizados y resolución de dudas por asignatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Chatbot padre para planes diarios</li>
                <li>• Chatbots especializados por materia</li>
                <li>• Exámenes de práctica con corrección automática</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-green-600" />
                Gestión de Archivos
              </CardTitle>
              <CardDescription>
                Sube y analiza tus temarios y horarios con IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Análisis inteligente de PDFs</li>
                <li>• Extracción automática de temas</li>
                <li>• Integración con planes de estudio</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-purple-600" />
                Agenda de Exámenes
              </CardTitle>
              <CardDescription>
                Calendario mensual con recordatorios inteligentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Vista calendario interactivo</li>
                <li>• Recordatorios automáticos</li>
                <li>• Notas y detalles por examen</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-orange-600" />
                Flashcards & Checklist
              </CardTitle>
              <CardDescription>
                Recuerdo activo con corrección por IA y seguimiento de progreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Flashcards con scoring inteligente</li>
                <li>• Espaciado de repetición automático</li>
                <li>• Checklist bloqueado por rendimiento</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Button
                data-testid="google-login-button"
                onClick={handleLogin}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Iniciar sesión con Google
              </Button>
              <p className="text-sm text-gray-600 mt-4">
                Acceso seguro con tu cuenta de Google
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;