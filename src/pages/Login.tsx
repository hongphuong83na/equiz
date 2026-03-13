import React from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center"
      >
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full">
          <LogIn size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-stone-800">EduQuiz Tin Học</h1>
        <p className="text-stone-500 mb-8">Hệ thống thi trắc nghiệm trực tuyến dành cho học sinh và giáo viên.</p>
        
        <button
          onClick={handleLogin}
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          Đăng nhập với Google
        </button>
        
        <div className="mt-8 pt-6 border-t border-stone-100 text-xs text-stone-400">
          © 2026 EduQuiz System. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}
