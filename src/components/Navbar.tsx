import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, logOut } from '../firebase';
import { LogIn, LogOut, User as UserIcon, Settings, CalendarDays, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const { user, isAdmin } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-[#e5e5e5] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-[#5A5A40]" />
              <span className="font-serif text-2xl font-bold text-[#1a1a1a]">Workshop Discovery</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-[#5A5A40] transition-colors flex items-center gap-1">
                <Info className="h-4 w-4" />
                Về chúng tôi
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-[#5A5A40] transition-colors flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  Vé của tôi
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium hover:text-[#5A5A40] transition-colors flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    Quản lý
                  </Link>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={logOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5A5A40] rounded-full hover:bg-[#4a4a35] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </motion.button>
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5A5A40] rounded-full hover:bg-[#4a4a35] transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
