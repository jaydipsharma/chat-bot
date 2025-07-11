
// app/chat/page.tsx
'use client';

import { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      console.log('res   ==>', res);
      

      const data = await res.json();

      if (!res.ok) {
        if (data?.error?.includes('PDF file not found')) {
          alert('❌ PDF file not found. Please ensure the file exists at /files/profiles.pdf');
        } else {
          alert(`❌ Something went wrong: ${data?.error || 'Unknown backend error'}`);
        }
        return;
      }

      const botMsg = { role: 'bot', content: data?.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      alert(`❌ Unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-6">
        {/* <h1 className="text-3xl font-bold text-center text-blue-700">📄 Gemini PDF Chatbot</h1> */}

        <div className="h-[400px] overflow-y-auto border rounded-md p-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-lg text-sm shadow-md whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <p className="text-gray-500 italic">Thinking...</p>}
        </div>

        <div className="flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask something from the PDF..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={send}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
