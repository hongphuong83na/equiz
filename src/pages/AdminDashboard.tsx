import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Exam, Question, Result } from '../types';
import { sampleQuestions } from '../data/sampleData';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  ChevronRight,
  Database,
  CheckCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  user: UserProfile;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const location = useLocation();
  
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <Link 
          to="/admin" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname === '/admin' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link 
          to="/admin/exams" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname.includes('/admin/exams') ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
        >
          <FileText size={20} />
          Quản lý đề thi
        </Link>
        <Link 
          to="/admin/results" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${location.pathname.includes('/admin/results') ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
        >
          <Users size={20} />
          Kết quả thi
        </Link>
      </aside>

      {/* Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardStats />} />
          <Route path="/exams" element={<ExamManagement />} />
          <Route path="/results" element={<ResultManagement />} />
        </Routes>
      </div>
    </div>
  );
}

function DashboardStats() {
  const [stats, setStats] = useState({ students: 0, exams: 0, results: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [uSnap, eSnap, rSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'))),
        getDocs(query(collection(db, 'exams'))),
        getDocs(query(collection(db, 'results')))
      ]);
      setStats({
        students: uSnap.size,
        exams: eSnap.size,
        results: rSnap.size
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Tổng học sinh', value: stats.students, icon: Users, color: 'bg-blue-500' },
    { title: 'Tổng đề thi', value: stats.exams, icon: FileText, color: 'bg-emerald-500' },
    { title: 'Bài thi đã nộp', value: stats.results, icon: CheckCircle, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${card.color} text-white rounded-xl flex items-center justify-center shadow-lg`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{card.title}</p>
              <p className="text-2xl font-black text-stone-800">{loading ? '...' : card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-xl font-bold mb-4">Chào mừng Quản trị viên!</h3>
        <p className="text-stone-500 leading-relaxed">
          Hệ thống đang hoạt động ổn định. Bạn có thể quản lý đề thi, theo dõi kết quả của học sinh và xuất báo cáo Excel từ thanh menu bên trái.
        </p>
      </div>
    </div>
  );
}

function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', subject: 'Tin học', duration: 45, code: '' });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const q = query(collection(db, 'exams'));
    const snap = await getDocs(q);
    setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
    setLoading(false);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'exams'), {
        ...newExam,
        totalQuestions: 0,
        createdAt: serverTimestamp()
      });
      
      // Add sample questions if it's the first exam or by choice
      if (window.confirm('Bạn có muốn thêm 20 câu hỏi mẫu môn Tin học vào đề thi này không?')) {
        const batch = writeBatch(db);
        sampleQuestions.forEach(q => {
          const qRef = doc(collection(db, 'exams', docRef.id, 'questions'));
          batch.set(qRef, { ...q, examId: docRef.id });
        });
        await batch.commit();
        await updateDoc(docRef, { totalQuestions: sampleQuestions.length });
      }

      setIsCreating(false);
      setNewExam({ title: '', subject: 'Tin học', duration: 45, code: '' });
      fetchExams();
    } catch (err) {
      console.error('Error creating exam:', err);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá đề thi này?')) return;
    await deleteDoc(doc(db, 'exams', id));
    fetchExams();
  };

  const handleImportExcel = async (examId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const batch = writeBatch(db);
        let count = 0;
        
        data.forEach((row) => {
          if (row.question && row.correctAnswer) {
            const qRef = doc(collection(db, 'exams', examId, 'questions'));
            batch.set(qRef, {
              examId,
              type: row.type || 'MCQ',
              question: row.question,
              optionA: row.optionA || '',
              optionB: row.optionB || '',
              optionC: row.optionC || '',
              optionD: row.optionD || '',
              correctAnswer: String(row.correctAnswer)
            });
            count++;
          }
        });

        await batch.commit();
        await updateDoc(doc(db, 'exams', examId), { totalQuestions: count });
        alert(`Đã nhập thành công ${count} câu hỏi!`);
        fetchExams();
      } catch (err) {
        console.error('Error importing Excel:', err);
        alert('Có lỗi xảy ra khi nhập file Excel. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">Quản lý đề thi</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all"
        >
          <Plus size={20} />
          Tạo đề thi mới
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-2xl shadow-xl border border-emerald-200"
        >
          <form onSubmit={handleCreateExam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-stone-700 mb-1">Tiêu đề đề thi</label>
              <input 
                required
                type="text" 
                value={newExam.title}
                onChange={e => setNewExam({...newExam, title: e.target.value})}
                placeholder="VD: Kiểm tra giữa kỳ Tin học 12"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Mã đề thi</label>
              <input 
                required
                type="text" 
                value={newExam.code}
                onChange={e => setNewExam({...newExam, code: e.target.value})}
                placeholder="VD: TIN12-01"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Thời gian (phút)</label>
              <input 
                required
                type="number" 
                value={newExam.duration}
                onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value)})}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 text-stone-500 font-bold">Huỷ</button>
              <button type="submit" className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-lg">Lưu đề thi</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-10 text-stone-400">Đang tải...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-stone-200 text-stone-400">
            Chưa có đề thi nào. Hãy tạo đề thi đầu tiên!
          </div>
        ) : (
          exams.map(exam => (
            <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-stone-800">{exam.title}</h3>
                <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
                  <span className="bg-stone-100 px-2 py-1 rounded font-mono font-bold text-stone-700">{exam.code}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration} phút</span>
                  <span className="flex items-center gap-1"><HelpCircle size={14} /> {exam.totalQuestions} câu hỏi</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" title="Nhập câu hỏi từ Excel">
                  <Database size={20} />
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    onChange={(e) => handleImportExcel(exam.id, e)} 
                  />
                </label>
                <button 
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Xoá đề thi"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ResultManagement() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const q = query(collection(db, 'results'));
    const snap = await getDocs(q);
    setResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as Result)));
    setLoading(false);
  };

  const exportToExcel = () => {
    const data = results.map(r => ({
      'Họ và tên': r.userName,
      'Lớp': r.userClass,
      'Đề thi': r.examTitle,
      'Điểm số': r.score,
      'Thời gian nộp': r.submitTime?.toDate().toLocaleString() || 'N/A'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kết quả thi");
    XLSX.writeFile(wb, "Ket_qua_thi_Tin_hoc.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">Kết quả thi</h2>
        <button 
          onClick={exportToExcel}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
        >
          <Download size={20} />
          Xuất Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-50 border-bottom border-stone-200">
            <tr>
              <th className="p-4 text-xs font-bold text-stone-400 uppercase">Học sinh</th>
              <th className="p-4 text-xs font-bold text-stone-400 uppercase">Lớp</th>
              <th className="p-4 text-xs font-bold text-stone-400 uppercase">Đề thi</th>
              <th className="p-4 text-xs font-bold text-stone-400 uppercase">Điểm</th>
              <th className="p-4 text-xs font-bold text-stone-400 uppercase">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-stone-400">Đang tải dữ liệu...</td></tr>
            ) : results.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-stone-400">Chưa có kết quả nào.</td></tr>
            ) : (
              results.map(result => (
                <tr key={result.id} className="hover:bg-stone-50 transition-all">
                  <td className="p-4 font-bold text-stone-800">{result.userName}</td>
                  <td className="p-4 text-stone-600">{result.userClass}</td>
                  <td className="p-4 text-stone-600">{result.examTitle}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.score >= 8 ? 'bg-emerald-100 text-emerald-700' : result.score >= 5 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {result.score.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-stone-400">
                    {result.submitTime?.toDate().toLocaleString() || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
