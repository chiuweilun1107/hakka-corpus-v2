'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Send,
  Mic,
  Camera,
  FileText,
  Plus,
  Home,
  Languages,
  MessageSquare,
  BookOpen,
  ImageIcon,
  Loader2,
  User,
  Bot,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fetchChat, type ChatResponse } from '@/lib/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  image?: string
  mode?: string
}

const SUGGESTED_PROMPTS = [
  { text: '「食飯」的客語怎麼說？', icon: Languages },
  { text: '客語的六個腔調有什麼差別？', icon: BookOpen },
  { text: '幫我翻譯「你好，歡迎來到客庄」', icon: Languages },
  { text: '客家擂茶的由來是什麼？', icon: MessageSquare },
]

const SIDEBAR_FEATURES = [
  { icon: Languages, title: '華客翻譯', desc: '輸入華語句子，即時翻譯為客語五腔拼音' },
  { icon: MessageSquare, title: 'RAG 問答', desc: '基於語料庫的知識檢索，回答客語相關問題' },
  { icon: FileText, title: 'OCR 辨識', desc: '上傳含客語文字的圖片，自動辨識轉文字' },
  { icon: ImageIcon, title: '圖像辨識', desc: '拍照辨識物品，自動回答對應的客語說法' },
  { icon: Mic, title: '語音輸入', desc: '使用客語語音辨識 (ASR) 直接說客語' },
]

export default function AiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const response = await fetchChat(text.trim(), 'chat', sessionId)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        mode: 'chat',
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，目前無法處理您的請求。請確認後端伺服器已啟動 (port 8000)。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, sessionId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setSessionId('')
    setInput('')
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static z-50 h-full w-64 bg-hakka-navy flex flex-col transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Sidebar Header */}
        <div className="px-4 pt-5 pb-3 flex items-center gap-2.5">
          <img src="/logo.png" alt="客語 AI 助手" className="w-8 h-8 rounded-lg" />
          <span className="text-[15px] font-bold text-white tracking-wide">客語 AI 助手</span>
          <button
            className="lg:hidden ml-auto text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
            開啟新對話
          </button>
        </div>

        {/* Feature descriptions */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">
            功能說明
          </div>
          <div className="space-y-3">
            {SIDEBAR_FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="flex items-start gap-2.5 text-white/70">
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[13px] font-medium text-white/90">{f.title}</div>
                    <div className="text-[11px] text-white/50 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm py-2 rounded-lg hover:bg-white/5 px-2 transition-colors"
          >
            <Home className="h-4 w-4" />
            返回首頁
          </Link>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">客語 AI 助手</span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Gemini + RAG
          </span>
        </div>

        {/* Chat Messages */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome State */
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-5 shadow-lg">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1.5">客語 AI 助手</h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-md">
                翻譯華語/客語、問答客語知識、辨識圖片與文字。請輸入訊息或選擇下方範例開始。
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 max-w-lg">
                {SUGGESTED_PROMPTS.map((p) => {
                  const Icon = p.icon
                  return (
                    <button
                      key={p.text}
                      onClick={() => sendMessage(p.text)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      {p.text}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gradient-to-br from-primary to-primary/60 text-white'
                  )}>
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-md'
                      : 'bg-card border border-border rounded-tl-md shadow-sm'
                  )}>
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="上傳圖片"
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    <div className={cn(
                      'text-sm leading-relaxed whitespace-pre-wrap',
                      msg.role === 'assistant' && 'text-foreground'
                    )}>
                      {msg.content}
                    </div>
                    <div className={cn(
                      'text-[10px] mt-1.5',
                      msg.role === 'user' ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
                    )}>
                      {msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在思考...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card px-4 py-3">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-background rounded-2xl border border-border px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              {/* Tool buttons */}
              <div className="flex items-center gap-1 pb-1">
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="圖片上傳"
                >
                  <Camera className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="OCR 文字辨識"
                >
                  <FileText className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="語音輸入"
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="輸入訊息... (Shift+Enter 換行)"
                className="flex-1 resize-none bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1.5 max-h-36"
              />

              {/* Send button */}
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="rounded-xl h-9 w-9 shrink-0 mb-0.5"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI 助手基於 Gemini + 客語語料庫 RAG，回答僅供參考
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
