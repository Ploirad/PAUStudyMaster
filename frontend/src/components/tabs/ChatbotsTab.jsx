import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Send, Trash2, MessageCircle, Download } from 'lucide-react';
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
        
        // Show a toast for each exam action executed by the backend
        if (Array.isArray(data.action_results)) {
          for (const result of data.action_results) {
            if (result.action === 'upsert_exam' && result.status === 'ok') {
              toast.success(`Examen de ${result.subject_name} añadido a tu agenda`);
            } else if (result.action === 'delete_exam' && result.status === 'ok') {
              toast.success(`Examen de ${result.subject_name} eliminado`);
            } else if (result.action === 'delete_exam' && result.status === 'not_found') {
              toast.error(`No se encontró el examen de ${result.subject_name}`);
            }
          }
        }
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
                chatType="parent"
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
                  chatType={subject.subject_id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const ChatInterface = ({ chatHistory, message, setMessage, sendMessage, clearHistory, loading, chatType }) => {
  const downloadMessages = () => {
    if (chatHistory.length === 0) {
      toast.error('No hay mensajes para descargar');
      return;
    }
    const timestamp = new Date().toLocaleString('es-ES');
    const content = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'Tú' : 'Asistente',
      mensaje: msg.content,
      hora: new Date(msg.timestamp).toLocaleString('es-ES')
    }));
    const jsonStr = JSON.stringify(
      {
        tipo_chat: chatType,
        fecha_descarga: timestamp,
        total_mensajes: chatHistory.length,
        mensajes: content
      },
      null,
      2
    );
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr));
    element.setAttribute('download', `chat_${chatType}_${new Date().getTime()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('¡Mensajes descargados correctamente!');
  };
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
                    <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        blockquote: ({node, ...props}) => (
                          <blockquote className={`border-l-4 ${msg.role === 'user' ? 'border-blue-300' : 'border-gray-300'} pl-3 italic mb-2 py-1`} {...props} />
                        ),
                        code: ({node, inline, ...props}) => 
                          inline ? 
                            <code className={`${msg.role === 'user' ? 'bg-blue-700' : 'bg-gray-200'} rounded px-1.5 py-0.5 text-xs font-mono`} {...props} /> :
                            <code className={`block ${msg.role === 'user' ? 'bg-blue-700' : 'bg-gray-100'} rounded p-3 mb-2 overflow-x-auto text-xs font-mono`} {...props} />,
                        pre: ({node, ...props}) => <pre className="mb-2 overflow-x-auto" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                        h4: ({node, ...props}) => <h4 className="text-sm font-semibold mb-1" {...props} />,
                        h5: ({node, ...props}) => <h5 className="text-xs font-semibold mb-1" {...props} />,
                        h6: ({node, ...props}) => <h6 className="text-xs font-semibold mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        a: ({node, ...props}) => (
                          <a className={`underline ${msg.role === 'user' ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'}`} target="_blank" rel="noopener noreferrer" {...props} />
                        ),
                        table: ({node, ...props}) => <table className="border-collapse border border-gray-300 mb-2 text-xs" {...props} />,
                        th: ({node, ...props}) => <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-bold" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-300 px-2 py-1" {...props} />,
                        hr: ({node, ...props}) => <hr className="my-2 border-gray-300" {...props} />,
                        del: ({node, ...props}) => <del className="line-through" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <p className="text-xs mt-2 opacity-70">
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

      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
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
            data-testid="download-messages-button"
            variant="outline"
            onClick={downloadMessages}
            size="sm"
            disabled={chatHistory.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
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