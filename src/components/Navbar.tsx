import { Link } from 'react-router-dom'
import { CalendarDays, Info, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { signInWithGoogle, logOut } from '../lib/firebase'
import { useState } from 'react'

export default function Navbar() {
  const { user, loading, authAvailable } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  async function handleLogin() {
    setAuthError(null)
    if (!authAvailable) {
      setAuthError('Thêm cấu hình Firebase vào file .env.local (xem README).')
      return
    }
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error(e)
      setAuthError('Đăng nhập thất bại. Thử lại hoặc kiểm tra domain trong Firebase.')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f9f9f5]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-[#1a1a1a]">
          <CalendarDays className="h-7 w-7 text-[#4a4e31]" aria-hidden />
          <span
            className="font-semibold tracking-tight"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            Workshop Discovery
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/about"
            className="hidden items-center gap-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-[#4a4e31] sm:flex"
          >
            <Info className="h-4 w-4" aria-hidden />
            Về chúng tôi
          </Link>

          {!loading &&
            (user ? (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full border border-stone-200"
                  />
                )}
                <span className="hidden max-w-[140px] truncate text-sm text-stone-600 sm:inline">
                  {user.displayName ?? user.email}
                </span>
                <button
                  type="button"
                  onClick={() => logOut()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#4a4e31] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3d4129]"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 rounded-full bg-[#4a4e31] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3d4129]"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  Đăng nhập
                </button>
                {authError && (
                  <p className="max-w-[220px] text-right text-xs text-red-600">{authError}</p>
                )}
              </div>
            ))}
        </nav>
      </div>
    </header>
  )
}
