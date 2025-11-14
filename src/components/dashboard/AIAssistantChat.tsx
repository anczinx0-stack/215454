import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, X } from 'lucide-react';

// ALL Q&A FROM FIRST CODE (unchanged)
const platformKnowledge = {
  'how do i sign up as a student': 'Students sign up for free:\n1. Click “Connect Wallet” on the homepage\n2. MetaMask will prompt you to connect\n3. Fill in your full name and email\n4. Your wallet becomes your permanent academic identity\nNo payment required – unlimited access for students.',
  'how do i request institution authorization': 'To become an authorized issuer:\n1. Go to “Institution → Request Authorization”\n2. Enter institution name, official website, and admin wallet address\n3. Submit the form\n4. Platform admin reviews (usually within 24h)\n5. Once approved, you can issue credentials immediately.',
  // ... ALL OTHER Q&A FROM YOUR FIRST CODE HERE (UNCHANGED)
};

// -------------------------- NEW RESPONSE LOGIC (FROM SECOND CODE) --------------------------
const getAIResponse = (query) => {
  const msg = query.toLowerCase();

  // EXACT STYLE OF SEARCH LOGIC FROM SECOND CODE
  for (const [key, value] of Object.entries(platformKnowledge)) {
    if (msg.includes(key)) return value;
  }

  if (msg.includes('sign up') || msg.includes('student register'))
    return platformKnowledge['how do i sign up as a student'];

  if (msg.includes('authorize') || msg.includes('institution permission'))
    return platformKnowledge['how do i request institution authorization'];

  if (msg.includes('credential') && msg.includes('issue'))
    return platformKnowledge['what information is required to issue a credential'];

  if (msg.includes('verify') || msg.includes('verification'))
    return platformKnowledge['how does a university verify a credential'];

  if (msg.includes('soulbound') || msg.includes('sbt'))
    return platformKnowledge['why are credentials non-transferable'];

  if (msg.includes('revoke') || msg.includes('cancel'))
    return platformKnowledge['can i edit a credential after issuing'];

  if (msg.includes('wallet') || msg.includes('metamask'))
    return platformKnowledge['how do i switch to sepolia testnet'];

  if (msg.includes('ipfs'))
    return platformKnowledge['what happens if ipfs node goes down'];

  if (msg.includes('plan') || msg.includes('price'))
    return platformKnowledge['what are pricing plans'];

  if (msg.includes('security'))
    return platformKnowledge['are private keys ever sent to the server'];

  // fallback
  return "I'm not sure about that. Ask me about:\n- issuing credentials\n- verification\n- SBTs\n- revoking tokens\n- wallet issues\n- IPFS storage\n- pricing plans\n- blockchain security";
};

export default function AIAssistantChat() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for the Academic Credentials Platform. Ask me anything.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = getAIResponse(input);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 500);
  };

  const handleSuggestionClick = (sugg) => {
    setInput(sugg);
    setTimeout(handleSend, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Chat cleared! How can I help you?',
        timestamp: new Date()
      }
    ]);
  };

  const quickSuggestions = [
    'How do I issue a credential?',
    'How do students verify credentials?',
    'What is a soulbound token?',
    'What are the pricing plans?'
  ];

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-2xl border border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Assistant</h3>
            <p className="text-xs text-gray-400">Ask your questions</p>
          </div>
        </div>
        <button onClick={clearChat} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-400">AI Assistant</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
              <span className="text-sm text-gray-300">Thinking...</span>
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2 px-2">
            {quickSuggestions.map((sugg, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(sugg)}
                className="text-left text-xs bg-gray-700 text-gray-300 p-2 rounded-lg hover:bg-gray-600"
              >
                {sugg}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-green-600 text-white rounded-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
