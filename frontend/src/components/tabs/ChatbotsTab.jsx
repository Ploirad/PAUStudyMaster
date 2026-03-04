import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Send, Trash2, MessageCircle } from 'lucide-react';
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


const ChatbotsTab = ({ user }) => {
  const { subjects } = useSubjects(); // Use shared context instead of local state
  const [activeChat, setActiveChat] = useState('parent');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (activeChat) {
      fetchChatHistory(activeChat);
    }
  }, [activeChat]);

  const fetchChatHistory = async (chatType) => {
    try {
      const response = await fetchWithTimeout(`${BACKEND_URL}/api/chat/history?chat_type=${chatType}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data);
      } else {
        toast.error('Error al cargar historial de chat');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error(error.message || 'Error de conexión');
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      // Add context for parent chat
      const context = activeChat === 'parent' ? { today: todayDate } : null;

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: message,
          chat_type: activeChat,
          context: context
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh chat history
        await fetchChatHistory(activeChat);
        setMessage('');
        toast.success('¡Mensaje enviado!');
      } else {
        toast.error('Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/chat/history/${activeChat}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setChatHistory([]);
      toast.success('Historial borrado');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            Chatbots Inteligentes
          </CardTitle>
          <CardDescription>
            Interactúa con el chatbot padre para planes de estudio o chatbots especializados por asignatura
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeChat} onValueChange={setActiveChat}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex flex-wrap min-w-full gap-1">
          <TabsTrigger value="parent" data-testid="parent-chatbot-tab" className="flex-shrink-0">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chatbot Padre
          </TabsTrigger>
          {subjects.map((subject) => (
            <TabsTrigger key={subject.subject_id} value={subject.subject_id} data-testid={`chatbot-${subject.subject_id}`} className="flex-shrink-0">
              <span className="mr-2">{subject.icon}</span>
              {subject.name}
            </TabsTrigger>
          ))}
          </TabsList>
        </div>

        <TabsContent value="parent">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Padre - Planificación de Estudio</CardTitle>
              <CardDescription>
                Genera planes de estudio personalizados basados en tu horario, temarios y exámenes
              </CardDescription>
              <div className="mt-4">
                <Label htmlFor="today-date">Fecha de hoy</Label>
                <Input
                  id="today-date"
                  type="date"
                  value={todayDate}
                  onChange={(e) => setTodayDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ChatInterface
                chatHistory={chatHistory}
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                clearHistory={clearHistory}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {subjects.map((subject) => (
          <TabsContent key={subject.subject_id} value={subject.subject_id}>
            <Card 
              style={{ 
                background: `linear-gradient(to bottom, white 0%, ${subject.color} 100%)` 
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{subject.icon}</span>
                  Chatbot de {subject.name}
                </CardTitle>
                <CardDescription>
                  Resuelve dudas, obtén recursos de estudio y genera exámenes de práctica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatInterface
                  chatHistory={chatHistory}
                  message={message}
                  setMessage={setMessage}
                  sendMessage={sendMessage}
                  clearHistory={clearHistory}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const ChatInterface = ({ chatHistory, message, setMessage, sendMessage, clearHistory, loading }) => {
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] w-full border rounded-lg p-4 bg-gray-50" data-testid="chat-messages">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay mensajes aún. ¡Empieza la conversación!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                  data-testid={`chat-message-${msg.role}`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          data-testid="chat-input"
          placeholder="Escribe tu mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="resize-none"
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <Button
          data-testid="clear-chat-button"
          variant="outline"
          onClick={clearHistory}
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpiar historial
        </Button>
        <Button
          data-testid="send-message-button"
          onClick={sendMessage}
          disabled={loading || !message.trim()}
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  );
};

export default ChatbotsTab;