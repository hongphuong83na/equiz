import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { LogOut, Shield, GraduationCap, Layout } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Layout size={24} />
          </div>
          <span className="font-black text-xl tracking-tight text-stone-800 hidden sm:block">EduQuiz</span>
        </Link>

        <div className="flex items-center gap-4">
          {(user.role === 'admin' || user.role === 'teacher') && (
            <Link 
              to="/admin" 
              className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-all"
            >
              <Shield size={16} />
              Quản trị
            </Link>
          )}
          
          <div className="h-8 w-px bg-stone-200 mx-2 hidden sm:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-stone-800 leading-none">{user.name}</p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                {user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
