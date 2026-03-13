import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ExamPage from './pages/ExamPage';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          // New user, default to student
          const newUser: UserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Học sinh',
            email: firebaseUser.email || '',
            role: 'student',
            class: ''
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
        {user && <Navbar user={user} />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/" element={
              user ? (
                user.role === 'admin' || user.role === 'teacher' ? 
                <Navigate to="/admin" /> : 
                <StudentDashboard user={user} />
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/exam/:examId" element={user ? <ExamPage user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/admin/*" element={
              user && (user.role === 'admin' || user.role === 'teacher') ? 
              <AdminDashboard user={user} /> : 
              <Navigate to="/" />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
