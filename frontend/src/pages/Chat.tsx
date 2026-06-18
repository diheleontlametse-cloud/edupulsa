import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Hash, Users, Send, Bell, BookOpen, GraduationCap, Globe, RefreshCw } from 'lucide-react';
import { GRADES, SA_SUBJECTS } from '../lib/const';
import { authFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Channel {
  id: string;
  name: string;
  type: 'grade' | 'subject' | 'general';
  messageCount: number;
}

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  channel: string;
  content: string;
  created_at: string;
}

const gradeChannels: Channel[] = GRADES.map((g) => ({
  id: `grade-${g}`,
  name: `Grade ${g}`,
  type: 'grade',
  messageCount: 0,
}));

const subjectChannels: Channel[] = SA_SUBJECTS.slice(0, 12).map((s) => ({
  id: `subject-${s}`,
  name: s,
  type: 'subject',
  messageCount: 0,
}));

const generalChannels: Channel[] = [
  { id: 'general-1', name: 'General Discussion', type: 'general', messageCount: 0 },
  { id: 'general-2', name: 'School Events', type: 'general', messageCount: 0 },
  { id: 'general-3', name: 'Resources & Sharing', type: 'general', messageCount: 0 },
];

export default function Chat() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<Channel>(gradeChannels[9]);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!activeChannel) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/messages?channel=${encodeURIComponent(activeChannel.id)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [activeChannel.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;
    setSending(true);
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          sender_name: user.name,
          channel: activeChannel.id,
          content: messageInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.id) {
        setMessages((prev) => [...prev, data]);
        setMessageInput('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
    setSending(false);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isOwnMessage = (msg: Message) => msg.sender_id === user?.id;

  const renderChannelGroup = (title: string, icon: React.ReactNode, channels: Channel[]) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {icon}
        {title}
      </div>
      {channels.map((ch) => (
        <button
          key={ch.id}
          onClick={() => setActiveChannel(ch)}
          className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
            activeChannel.id === ch.id
              ? 'bg-teal-50 text-teal-900 border-l-4 border-teal-600'
              : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <Hash className="w-4 h-4" />
            {ch.name}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-full bg-sand-100 -m-6 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Educator Chat</h1>
        <p className="text-gray-600 mt-1">Connect with fellow educators by grade and subject.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-sand-100 border-r border-gray-200 overflow-y-auto">
          {renderChannelGroup('Grade Channels', <GraduationCap className="w-4 h-4" />, gradeChannels)}
          {renderChannelGroup('Subject Channels', <BookOpen className="w-4 h-4" />, subjectChannels)}
          {renderChannelGroup('General', <Globe className="w-4 h-4" />, generalChannels)}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-700" />
              <h2 className="font-semibold text-teal-900">{activeChannel.name}</h2>
              <span className="text-xs text-gray-500">{messages.length} messages</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchMessages}
                className="p-1.5 text-gray-400 hover:text-teal-700 transition-colors"
                title="Refresh messages"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Live</span>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isOwnMessage(msg) ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'
                  }`}>
                    {msg.sender_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className={`flex-1 max-w-[70%] ${isOwnMessage(msg) ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${isOwnMessage(msg) ? 'justify-end' : ''}`}>
                      <span className="text-sm font-semibold text-gray-900">{msg.sender_name}</span>
                      <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className={`inline-block px-3 py-2 rounded-lg mt-0.5 text-sm ${
                      isOwnMessage(msg)
                        ? 'bg-teal-700 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white flex items-center gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message #${activeChannel.name}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="p-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
