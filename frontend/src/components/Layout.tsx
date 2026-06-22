import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import ChatDrawer from './ChatDrawer';
import { MessageSquare } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 relative">
        {/* Chat toggle button - top right */}
        <button
          onClick={() => setChatOpen(true)}
          className={`fixed top-4 right-4 z-40 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
            chatOpen ? 'hidden' : 'bg-teal-700 text-white hover:bg-teal-800'
          }`}
          title="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {children}

        {/* Chat drawer */}
        <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />

        {/* Overlay when chat is open */}
        {chatOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setChatOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
