'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, MessageSquare, X, Send, Bot, User, Key, Settings,
  ChevronDown, RefreshCw, Copy, Check, ShieldAlert, Cpu
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  source?: string
  model?: string
}

interface AIChatboxProps {
  userRole?: string
}

export function AIChatbox({ userRole = 'tpo' }: AIChatboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('mistralai/Mistral-7B-Instruct-v0.3')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `Hello! 👋 I am your **Placement Ops AI Assistant** powered by Hugging Face.\n\nAsk me anything about JD Intake, candidate eligibility, SHAP match rankings, or interview scheduling!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'huggingface'
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('placement_ops_hf_key') || ''
      if (savedKey) setApiKey(savedKey)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      localStorage.setItem('placement_ops_hf_key', apiKey.trim())
    }
    setShowSettings(false)
  }

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const storedKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('placement_ops_hf_key') || '' : '')

    try {
      const response = await fetch(`${backendUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          api_key: storedKey || undefined,
          role_context: userRole
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to communicate with AI endpoint`)
      }

      const data = await response.json()

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'No response received from AI model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        model: data.model || selectedModel
      }

      setMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      // Fallback local response if backend network is unreachable
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `### 🤖 Placement Ops Co-Pilot\n\nI am currently operating in offline assistance mode.\n\n**To enable live Hugging Face model inferences:**\n1. Click the ⚙️ Settings icon in the header.\n2. Paste your **Hugging Face API Key** (starts with \`hf_\`).\n3. Select your model (e.g. \`Mistral-7B-Instruct\`).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local_fallback'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const quickPrompts = [
    "Draft a JD for Senior SDE Role",
    "Explain SHAP Match Ranking",
    "How to resolve schedule conflicts?",
    "Analyze Top Skill Gaps"
  ]

  const models = [
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B Instruct (Recommended)' },
    { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct' },
    { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'Llama 3.2 3B Instruct' },
    { id: 'meta-llama/Meta-Llama-3-8B-Instruct', name: 'Meta Llama 3 8B' }
  ]

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 text-white font-medium px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer border border-white/20"
          aria-label="Open AI Placement Assistant"
        >
          <div className="relative">
            <Sparkles size={20} className="animate-pulse text-amber-200" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-semibold tracking-wide font-mono uppercase">AI Co-Pilot</span>
        </button>
      )}

      {/* Main Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-[440 h-full] max-h-[640px] h-[85vh] bg-[#0c1017]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden motion-page">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-cyan-950/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot size={20} className="text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Placement Ops AI</h3>
                  <span className="text-[10px] font-mono bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Cpu size={10} /> Hugging Face
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready • {userRole.toUpperCase()} View
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl transition-all ${showSettings ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Hugging Face Key & Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Settings Drawer Slide-Down */}
          {showSettings && (
            <div className="p-4 bg-slate-950 border-b border-white/10 space-y-3 text-xs motion-page">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono text-[11px] uppercase tracking-wide">
                <Key size={14} /> Hugging Face API Configuration
              </div>

              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">
                    Hugging Face User Access Token (hf_...)
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. hf_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Get a free API key at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-cyan-400 underline">huggingface.co/settings/tokens</a>
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">
                    Select Inference Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Save Credentials
                  </button>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setApiKey('')
                        if (typeof window !== 'undefined') localStorage.removeItem('placement_ops_hf_key')
                      }}
                      className="px-3 bg-red-950/60 text-red-300 border border-red-800/50 hover:bg-red-900/60 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs scrollbar-thin scrollbar-thumb-white/10">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} motion-page`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                    <Bot size={15} className="text-black" />
                  </div>
                )}

                <div className={`group relative max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-lg'
                    : 'bg-slate-900/90 border border-white/10 text-gray-200 rounded-bl-none shadow-md'
                }`}>
                  {/* Markdown formatted content preview */}
                  <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-2 text-[10px] text-gray-400 pt-1 border-t border-white/5 font-mono">
                    <span>{msg.timestamp}</span>
                    
                    <div className="flex items-center gap-2">
                      {msg.source && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                          {msg.source === 'huggingface_router' ? 'HF Router' : msg.source === 'huggingface_inference' ? 'HF Inference' : 'Local AI'}
                        </span>
                      )}
                      
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={15} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start motion-page">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} className="text-black" />
                </div>
                <div className="bg-slate-900/90 border border-white/10 rounded-2xl rounded-bl-none p-3.5 text-gray-400 flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-emerald-400" />
                  <span className="text-xs font-mono">Hugging Face model thinking…</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggested Prompts */}
          {messages.length < 5 && (
            <div className="px-4 py-2 border-t border-white/5 bg-black/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 text-[10px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 px-2.5 py-1 rounded-full transition-all cursor-pointer hover:border-emerald-500/50"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-slate-950 border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-2xl px-3 py-1.5 focus-within:border-emerald-500 transition-colors"
            >
              <input
                type="text"
                placeholder="Ask Hugging Face AI Placement Co-Pilot..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-500 focus:outline-none py-1.5"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-30 disabled:hover:bg-emerald-500 transition-all cursor-pointer shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
