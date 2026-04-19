import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X, Bot } from 'lucide-react'
import { GoogleGenAI } from '@google/genai'

type Msg = { role: 'user' | 'model'; text: string }

const SYSTEM = `Bạn là trợ lý AI của trang "Workshop Discovery" (tiếng Việt).
Giúp người dùng tìm hiểu workshop, gợi ý khóa học phù hợp; trả lời ngắn gọn, thân thiện.`

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'model',
      text: 'Xin chào! Mình có thể gợi ý workshop hoặc trả lời thắc mắc cho bạn.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    if (!apiKey) {
      setConfigError('Thêm VITE_GEMINI_API_KEY vào .env.local (Google AI Studio).')
      return
    }
    setConfigError(null)
    setInput('')
    const next: Msg[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setLoading(true)
    try {
      const ai = new GoogleGenAI({ apiKey })
      const transcript = next
        .map((m) => `${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.text}`)
        .join('\n')
      const prompt = `${SYSTEM}\n\n${transcript}\nTrợ lý:`

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      })
      const reply = response.text?.trim() || 'Không có phản hồi.'
      setMessages([...next, { role: 'model', text: reply }])
    } catch (e) {
      console.error(e)
      setMessages([
        ...next,
        {
          role: 'model',
          text: 'Lỗi kết nối AI. Kiểm tra VITE_GEMINI_API_KEY và mạng.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#4a4e31] text-white shadow-lg transition hover:bg-[#3d4129] hover:shadow-xl"
        aria-label="Mở chat AI"
      >
        <MessageCircle className="h-7 w-7" aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-end sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Đóng nền"
          />
          <div className="relative flex max-h-[min(560px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 bg-[#f9f9f5] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a4e31] text-white">
                  <Bot className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 id="chat-title" className="text-sm font-semibold text-[#1a1a1a]">
                    Trợ lý Workshop
                  </h2>
                  <p className="text-xs text-stone-500">AI · Gemini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#4a4e31] text-white'
                        : 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-sm text-stone-400">Đang trả lời…</p>
              )}
              <div ref={bottomRef} />
            </div>

            {configError && (
              <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                {configError}
              </p>
            )}

            <div className="flex gap-2 border-t border-stone-100 p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void sendMessage()}
                placeholder="Hỏi về workshop…"
                className="min-w-0 flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none ring-[#4a4e31]/30 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4a4e31] text-white transition hover:bg-[#3d4129] disabled:opacity-40"
                aria-label="Gửi"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
