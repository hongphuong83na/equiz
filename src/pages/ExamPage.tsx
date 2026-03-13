import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Exam, Question, Result } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';

interface ExamPageProps {
  user: UserProfile;
}

export default function ExamPage({ user }: ExamPageProps) {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchExamData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId]);

  const fetchExamData = async () => {
    if (!examId) return;
    try {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (!examDoc.exists()) {
        navigate('/');
        return;
      }
      const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
      setExam(examData);
      setTimeLeft(examData.duration * 60);

      const qSnap = await getDocs(collection(db, 'exams', examId, 'questions'));
      let qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
      
      // Randomize questions
      qList = qList.sort(() => Math.random() - 0.5);
      setQuestions(qList);

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error fetching exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / questions.length) * 10;
    setFinalScore(score);

    try {
      const result: Result = {
        userId: user.id,
        userName: user.name,
        userClass: user.class || 'N/A',
        examId: examId!,
        examTitle: exam?.title || 'Unknown',
        score: parseFloat(score.toFixed(2)),
        answers,
        submitTime: serverTimestamp()
      };
      await addDoc(collection(db, 'results'), result);
      setIsFinished(true);
    } catch (err) {
      console.error('Error submitting result:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-600"></div></div>;

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-2xl border border-stone-200 text-center"
      >
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Hoàn thành bài thi!</h2>
        <p className="text-stone-500 mb-8">Kết quả của bạn đã được lưu lại trong hệ thống.</p>
        
        <div className="bg-stone-50 p-8 rounded-2xl mb-8 border border-stone-100">
          <div className="text-sm font-semibold text-stone-400 uppercase mb-2">Điểm số của bạn</div>
          <div className="text-6xl font-black text-emerald-600">{finalScore.toFixed(2)}</div>
          <div className="mt-4 text-stone-600 font-medium">
            {finalScore >= 8 ? 'Xuất sắc!' : finalScore >= 5 ? 'Đạt yêu cầu' : 'Cần cố gắng thêm'}
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="px-10 py-4 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          Về trang chủ
        </button>
      </motion.div>
    );
  }

  const currentQ = questions[currentIdx];
  const progress = ((Object.keys(answers).length) / questions.length) * 100;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-stone-200 flex items-center justify-between mb-8">
        <div>
          <h2 className="font-bold text-stone-800">{exam?.title}</h2>
          <p className="text-xs text-stone-500">Học sinh: {user.name} - Lớp: {user.class}</p>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-stone-100 text-stone-700'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
        
        <button 
          onClick={() => { if(window.confirm('Bạn có chắc chắn muốn nộp bài?')) handleSubmit(); }}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
        >
          <Send size={18} />
          Nộp bài
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 h-2 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="bg-emerald-500 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Question Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-2xl shadow-md border border-stone-200 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold rounded-full uppercase tracking-wider">
                  Câu {currentIdx + 1} / {questions.length}
                </span>
                <span className="text-xs font-medium text-stone-400 italic">
                  Loại: {currentQ?.type === 'MCQ' ? 'Trắc nghiệm' : 'Đúng / Sai'}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-stone-800 mb-8 leading-relaxed">
                {currentQ?.question}
              </h3>

              <div className="space-y-4">
                {currentQ?.type === 'MCQ' ? (
                  ['A', 'B', 'C', 'D'].map((opt) => {
                    const optKey = `option${opt}` as keyof Question;
                    const optVal = currentQ[optKey];
                    if (!optVal) return null;
                    
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectAnswer(currentQ.id, opt)}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${
                          answers[currentQ.id] === opt 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-stone-100 hover:border-stone-300 bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          answers[currentQ.id] === opt ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500'
                        }`}>
                          {opt}
                        </span>
                        <span className="font-medium">{optVal}</span>
                      </button>
                    );
                  })
                ) : (
                  ['True', 'False'].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleSelectAnswer(currentQ.id, val)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${
                        answers[currentQ.id] === val 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-stone-100 hover:border-stone-300 bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQ.id] === val ? 'border-emerald-500' : 'border-stone-300'
                      }`}>
                        {answers[currentQ.id] === val && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}
                      </div>
                      <span className="font-bold">{val === 'True' ? 'Đúng' : 'Sai'}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6">
            <button 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl flex items-center gap-2 disabled:opacity-30 hover:bg-stone-50 transition-all"
            >
              <ChevronLeft size={20} />
              Câu trước
            </button>
            <button 
              disabled={currentIdx === questions.length - 1}
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl flex items-center gap-2 disabled:opacity-30 hover:bg-stone-50 transition-all"
            >
              Câu sau
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Question Grid */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-stone-200">
            <h4 className="font-bold text-stone-800 mb-4">Danh sách câu hỏi</h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    currentIdx === idx 
                    ? 'ring-2 ring-emerald-500 bg-emerald-500 text-white' 
                    : answers[q.id] 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-stone-100 space-y-3">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm" /> Đang chọn
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <div className="w-3 h-3 bg-emerald-100 rounded-sm" /> Đã trả lời
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <div className="w-3 h-3 bg-stone-100 rounded-sm" /> Chưa trả lời
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
