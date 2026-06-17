import { useState } from 'react';
import { MessageSquare, Hash, Users, Send, Bell, BookOpen, GraduationCap, Globe } from 'lucide-react';
import { GRADES, SA_SUBJECTS } from '../lib/const';

interface Channel {
  id: string;
  name: string;
  type: 'grade' | 'subject' | 'general';
  messageCount: number;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  channelId: string;
}

const gradeChannels: Channel[] = GRADES.map((g) => ({
  id: `grade-${g}`,
  name: `Grade ${g}`,
  type: 'grade',
  messageCount: Math.floor(Math.random() * 50) + 2,
}));

const subjectChannels: Channel[] = SA_SUBJECTS.slice(0, 8).map((s) => ({
  id: `subject-${s}`,
  name: s,
  type: 'subject',
  messageCount: Math.floor(Math.random() * 30) + 1,
}));

const generalChannels: Channel[] = [
  { id: 'general-1', name: 'General Discussion', type: 'general', messageCount: 124 },
  { id: 'general-2', name: 'School Events', type: 'general', messageCount: 45 },
  { id: 'general-3', name: 'Resources & Sharing', type: 'general', messageCount: 67 },
];

const mockMessages: Message[] = [
  { id: 1, sender: 'Mrs. Naidoo', content: 'Does anyone have a good worksheet for quadratic functions?', time: '09:14', channelId: 'grade-10' },
  { id: 2, sender: 'Mr. Mokoena', content: 'I shared one in the Resources channel last week!', time: '09:16', channelId: 'grade-10' },
  { id: 3, sender: 'Ms. Dlamini', content: 'Thanks, I will check it out.', time: '09:18', channelId: 'grade-10' },
  { id: 4, sender: 'Mr. Zulu', content: 'Reminder: staff meeting at 14:00 today.', time: '08:30', channelId: 'general-1' },
  { id: 5, sender: 'Mrs. Khumalo', content: 'The matric study guides are now available in the library.', time: '10:05', channelId: 'general-2' },
  { id: 6, sender: 'Ms. Sithole', content: 'Here is a link to the DBE past papers archive.', time: '11:22', channelId: 'general-3' },
  { id: 7, sender: 'Mr. Nkosi', content: 'Has anyone tried the new CAPS-aligned assessment rubrics?', time: '12:00', channelId: 'subject-Mathematics' },
];

export default function Chat() {
  const [activeChannel, setActiveChannel] = useState<Channel>(gradeChannels[9]); // Grade 10
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const channelMessages = messages.filter((m) => m.channelId === activeChannel.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const newMessage: Message = {
      id: Date.now(),
      sender: 'You',
      content: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channelId: activeChannel.id,
    };
    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

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
          {ch.messageCount > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {ch.messageCount}
            </span>
          )}
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
              <span className="text-xs text-gray-500">{channelMessages.length} messages</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">{Math.floor(Math.random() * 20) + 5} online</span>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {channelMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              channelMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.sender.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{msg.sender}</span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white flex items-center gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message #${activeChannel.name}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            />
            <button
              type="submit"
              className="p-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
