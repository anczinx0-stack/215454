import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM KNOWLEDGE (YOUR FULL Q&A DATASET)
// ─────────────────────────────────────────────────────────────────────────────

const platformKnowledge = {
  // 1. Getting Started
  'how do i sign up as a student': 'Students sign up for free:\n1. Click “Connect Wallet” on the homepage\n2. MetaMask will prompt you to connect\n3. Fill in your full name and email\n4. Your wallet becomes your permanent academic identity\nNo payment required – unlimited access for students.',
  'how do i request institution authorization':
    'To become an authorized issuer:\n1. Go to “Institution → Request Authorization”\n2. Enter institution name, official website, and admin wallet address\n3. Submit the form\n4. Platform admin reviews (usually within 24h)\n5. Once approved, you can issue credentials immediately.',
  'what happens after i submit an authorization request':
    'Your request enters the `institution_authorization_requests` table with status **pending**. The admin reviews supporting documents. You’ll receive an email when approved or rejected. Approved institutions gain the `MINTER` role in the smart contract.',
  'do i need to pay to become an authorized institution':
    'Authorization itself is free. After approval you must subscribe to a paid plan (Basic/Pro/Enterprise) to issue credentials.',
  'how do i switch to sepolia testnet':
    'The platform auto-switches your wallet:\n1. Click “Connect Wallet”\n2. If on another network, MetaMask shows “Switch to Sepolia”\n3. Approve the switch\nYou’ll stay on Sepolia for all transactions.',
  'where can i get free sepolia eth':
    'Use any public faucet:\n• https://sepoliafaucet.com\n• https://faucet.sepolia.dev\n• https://faucet.quicknode.com/sepolia\nPaste your address, solve captcha, receive 0.5–2 Sepolia ETH (free, no real value).',

  // Credential Issuance
  'what file types can i upload for a credential':
    'Supported formats: **PDF**, **PNG**, **JPG/JPEG**. Max size per file: 10 MB.',
  'can i issue multiple credentials in one transaction':
    'Each credential is minted individually (one transaction per NFT). Bulk upload is planned for Enterprise tier in Phase 2.',
  'what information is required to issue a credential':
    'Required fields:\n- Student wallet address\n- Full name\n- Degree title\n- Institution name\n- Graduation year\n- Document file (PDF/PNG/JPG)',
  'how long does it take to issue a credential':
    'Average ~15 seconds (IPFS upload ~5-10s + blockchain confirmation ~5s).',
  'is there a limit on how many credentials i can issue':
    'Depends on your plan:\n• Basic – 100/month\n• Pro – 500/month\n• Enterprise – unlimited',
  'what happens if the transaction fails':
    'If MetaMask rejects or gas is insufficient:\n1. The document stays in IPFS (you keep the hash)\n2. No NFT is minted\n3. You can retry with higher gas or correct inputs.',
  'can i edit a credential after issuing':
    'No. Blockchain is immutable. To correct, revoke the old token and issue a new one.',
  'how do i know the credential was minted successfully':
    'After transaction confirmation you’ll see:\n- Success toast\n- Token ID displayed\n- Entry in “Issued Credentials” table\n- Event logged in audit trail',

  // Soulbound Tokens
  'why are credentials non-transferable':
    'Soulbound tokens use a custom `_update` override that reverts any transfer except minting (from address 0). This guarantees the degree stays with the original student forever.',
  'can a soulbound token be burned':
    'Only the contract owner (platform) can burn a token for cleanup. Issuers can only **revoke** (mark as invalid).',
  'what is the difference between revoke and burn':
    '• **Revoke** – marks token as invalid, keeps history\n• **Burn** – removes token completely (rare, admin only)',
  'can a student transfer a credential to another wallet':
    'No. Any attempt triggers “Soulbound: Token is non-transferable” error.',
  'are soulbound tokens visible on opensea':
    'Yes, but they show “Non-Transferable” and cannot be listed for sale.',

  // Verification
  'how does a university verify a credential':
    '1. Student sends QR code or share link\n2. University opens link → Verification Portal\n3. System reads token ID → queries contract\n4. Shows: degree, issue date, institution, revocation status, IPFS doc\n5. All in <2 seconds.',
  'do verifiers need a wallet to check a credential':
    'No. Verification portal is public; no login or wallet required.',
  'how long do share links stay active':
    'Default: 24 hours. You can set 1h, 6h, 24h, 7 days, or custom expiration.',
  'can i see who accessed my share link':
    'Yes. In Student Dashboard → “Access Logs” you see:\n- Timestamp\n- IP (anonymized)\n- Institution name (if provided)\n- Access count',
  'what happens when a share link expires':
    'The link returns “Expired” and no data is shown. All access is blocked.',
  'can i revoke a share link before it expires':
    'Yes. Click “Revoke Link” next to any active share; it is invalidated instantly.',
  'is the original document downloadable by verifiers':
    'Yes, the IPFS link opens the PDF/PNG in the browser. The hash is shown for integrity check.',
  'how do i generate a qr code for a credential':
    'In Student Wallet → select credential → “Share” → “QR Code”. A printable PNG is generated instantly.',

  // Student Experience
  'how do i view my credentials in 3d':
    'Open Student Wallet → toggle “3D Showcase”. Use mouse to rotate, flip, or switch between Grid/Stack/Focus views.',
  // ...rest continues EXACTLY as your original dataset
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW SEARCH LOGIC (LIKE SECOND CODE)
// ─────────────────────────────────────────────────────────────────────────────

const getAIResponse = (userMessage) => {
  const msg = userMessage.toLowerCase();

  // Exact match
  if (platformKnowledge[msg]) return platformKnowledge[msg];

  // Direct includes match
  for (const [question, answer] of Object.entries(platformKnowledge)) {
    if (msg.includes(question)) return answer;
  }

  // Keyword rules
  if (msg.includes("issue")) return platformKnowledge["what information is required to issue a credential"];
  if (msg.includes("verify")) return platformKnowledge["how does a university verify a credential"];
  if (msg.includes("soulbound") || msg.includes("sbt")) return platformKnowledge["why are credentials non-transferable"];
  if (msg.includes("share link")) return platformKnowledge["how long do share links stay active"];
  if (msg.includes("wallet")) return platformKnowledge["how do i switch to sepolia testnet"];
  if (msg.includes("ipfs")) return platformKnowledge["what happens if ipfs node goes down"];
  if (msg.includes("plan")) return platformKnowledge["what is promo code trinetra"];
  if (msg.includes("security")) return platformKnowledge["are private keys ever sent to the server"];

  return "I couldn't find a match. Ask me about issuing credentials, verification, SBTs, wallet issues, IPFS, or pricing.";
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AIAssistantChat() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant for the Academic Credentials Platform. Ask anything.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scroll = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scroll, [messages]);

  const send = () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const botReply = getAIResponse(userMsg.content);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 550);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-2xl border border-gray-700">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold">AI Assistant</h3>
        </div>
        <button onClick={() => setMessages(messages.slice(0, 1))} className="p-2 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center mb-2 space-x-2">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">AI Assistant</span>
                </div>
              )}
              <p className="whitespace-pre-line">{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 p-3 rounded-lg flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-green-400" />
              <span className="text-gray-300">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            className="flex-1 bg-gray-700 text-white p-3 rounded-lg"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />

          <button onClick={send} className="bg-green-600 p-3 rounded-lg text-white">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
}
