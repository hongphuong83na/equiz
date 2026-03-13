import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Exam } from '../types';
import { motion } from 'motion/react';
import { Search, BookOpen, Clock, ChevronRight, User } from 'lucide-react';

interface StudentDashboardProps {
  user: UserProfile;
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [examCode, setExamCode] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [className, setClassName] = useState(user.class || '');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const q = query(collection(db, 'exams'));
      const querySnapshot = await getDocs(q);
      const examList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examList);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!className) {
      setError('Vui lòng nhập lớp của bạn trước khi vào thi.');
      return;
    }

    // Update class if changed
    if (className !== user.class) {
      await updateDoc(doc(db, 'users', user.id), { class: className });
    }

    const exam = exams.find(ex => ex.code === examCode);
    if (exam) {
      navigate(`/exam/${exam.id}`);
    } else {
      setError('Mã đề thi không chính xác. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="md:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-md border border-stone-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                <User size={40} />
              </div>
              <h2 className="text-xl font-bold text-stone-800">{user.name}</h2>
              <p className="text-stone-500 text-sm mb-4">{user.email}</p>
              
              <div className="w-full text-left">
                <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Lớp học</label>
                <input 
                  type="text" 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Nhập lớp (VD: 12A1)"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Section */}
        <div className="md:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-md border border-stone-200 mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="text-emerald-600" />
              Vào phòng thi
            </h2>
            
            <form onSubmit={handleJoinExam} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input 
                  type="text" 
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  placeholder="Nhập mã đề thi..."
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <button 
                type="submit"
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-100"
              >
                Bắt đầu thi
              </button>
            </form>
            
            {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
          </motion.div>

          <h3 className="text-lg font-bold mb-4 text-stone-700">Đề thi hiện có</h3>
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="text-center py-8 text-stone-400">Đang tải danh sách đề thi...</div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8 text-stone-400 bg-white rounded-2xl border border-dashed border-stone-300">
                Chưa có đề thi nào được tạo.
              </div>
            ) : (
              exams.map((exam, index) => (
                <motion.div 
                  key={exam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex items-center justify-between hover:border-emerald-300 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                      {exam.subject.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-800">{exam.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration} phút</span>
                        <span className="flex items-center gap-1"><BookOpen size={14} /> {exam.totalQuestions} câu hỏi</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-stone-400 uppercase mb-1">Mã đề</div>
                    <div className="font-mono font-bold text-emerald-600">{exam.code}</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
