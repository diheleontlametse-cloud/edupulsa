import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Hash, Users, Send, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { GRADES, SA_SUBJECTS } from '../lib/const';
import { authFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Channel {
  id: string;
  name: string;
  type: 'grade' | 'subject' | 'general';
}

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  channel: string;
  content: string;
  created_at: string;
}

const gradeChannels: Channel[] = GRADES.map((g) => ({ id: `grade-${g}`, name: `Grade ${g}`, type: 'grade' }));
const subjectChannels: Channel[] = SA_SUBJECTS.slice(0, 12).map((s) => ({ id: `subject-${s}`, name: s, type: 'subject' }));
const generalChannels: Channel[] = [
  { id: 'general-1', name: 'General Discussion', type: 'general' },
  { id: 'general-2', name: 'School Events', type: 'general' },
  { id: 'general-3', name: 'Resources & Sharing', type: 'general' },
];

export default function ChatDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, token } = useAuth();
  const [activeChannel, setActiveChannel] = useState<Channel>(gradeChannels[9]);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestMessageIdRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    if (!activeChannel) return;
    try {
      const res = await authFetch(`/api/messages?channel=${encodeURIComponent(activeChannel.id)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        if (data.length > 0) {
          latestMessageIdRef.current = Math.max(...data.map((m: Message) => m.id));
        }
        setLastFetchTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [activeChannel]);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (!token) return;

    const url = `/api/messages/stream?channel=${encodeURIComponent(activeChannel.id)}&token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setIsLive(true);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'message') {
          const msg = parsed.data as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          latestMessageIdRef.current = Math.max(latestMessageIdRef.current, msg.id);
        }
      } catch (err) {}
    };
    es.onerror = () => {
      setIsLive(false);
      es.close();
      reconnectTimeoutRef.current = setTimeout(() => connectSSE(), 5000);
    };
  }, [activeChannel, token]);

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    pollIntervalRef.current = setInterval(fetchMessages, 2000);
    connectSSE();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [isOpen, activeChannel, fetchMessages, connectSSE]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    const optimisticId = Date.now() * -1;
    const optimisticMsg: Message = { id: optimisticId, sender_id: user.id, sender_name: user.name, channel: activeChannel.id, content, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, sender_name: user.name, channel: activeChannel.id, content }),
      });
      const data = await res.json();
      if (data.id) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data : m)));
        latestMessageIdRef.current = Math.max(latestMessageIdRef.current, data.id);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }
    setSending(false);
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };
  const isOwnMessage = (msg: Message) => msg.sender_id === user?.id;

  const allChannels = [...gradeChannels, ...subjectChannels, ...generalChannels];

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-teal-900">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h2 className="font-semibold text-white">Educator Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs ${isLive ? 'text-green-300' : 'text-amber-300'}`}>
              {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'Live' : 'Polling'}
            </span>
            <button onClick={onClose} className="p-1 text-white hover:bg-teal-800 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel selector */}
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <select
            value={activeChannel.id}
            onChange={(e) => setActiveChannel(allChannels.find((c) => c.id === e.target.value) || generalChannels[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <optgroup label="Grades">
              {gradeChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
            <optgroup label="Subjects">
              {subjectChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
            <optgroup label="General">
              {generalChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2" />
              <p className="text-sm text-center">No messages yet in {activeChannel.name}. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isOwnMessage(msg) ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                  {msg.sender_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className={`flex-1 max-w-[75%] ${isOwnMessage(msg) ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-1 ${isOwnMessage(msg) ? 'justify-end' : ''}`}>
                    <span className="text-xs font-semibold text-gray-700">{msg.sender_name}</span>
                    <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                  </div>
                  <div className={`inline-block px-2.5 py-1.5 rounded-lg mt-0.5 text-sm ${isOwnMessage(msg) ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={`Message ${activeChannel.name}`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !messageInput.trim()} className="p-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
