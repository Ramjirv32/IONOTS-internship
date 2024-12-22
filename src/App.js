import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import ProjectList from './components/ProjectList'; // Your existing project list component

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/projects" /> : <Auth />} 
        />
        <Route 
          path="/projects" 
          element={user ? <ProjectList /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
