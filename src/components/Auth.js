import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import axios from 'axios';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/projects');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Save user data
      await axios.post('http://localhost:8001/api/users', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Save user data
      await axios.post('http://localhost:8001/api/users', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-6 font-['Space_Grotesk']">
      <div 
        className="w-full max-w-md"
        data-aos="fade-up"
      >
        <div className="backdrop-blur-lg bg-gray-900/50 rounded-2xl border border-gray-700/50 p-8 shadow-xl">
          <h2 className="text-4xl font-bold text-white mb-8 text-center tracking-tight leading-tight">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6 mb-8">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-gray-800/50 hover:bg-gray-800 text-white py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-700/50"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5"
              />
              Continue with Google
            </button>

            <button
              onClick={handleGithubSignIn}
              className="w-full flex items-center justify-center gap-3 bg-gray-800/50 hover:bg-gray-800 text-white py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-700/50"
            >
              <img 
                src="https://github.com/favicon.ico" 
                alt="GitHub" 
                className="w-5 h-5"
              />
              Continue with GitHub
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900/50 text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full relative bg-transparent text-white py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group border border-gray-700/50"
            >
              <span className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
              <span className="relative group-hover:text-black transition-colors duration-300">
                {isLogin ? 'Sign In' : 'Sign Up'}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Sign In"}
            </button>
          </div>
        </div>

        <div 
          className="mt-8 text-center text-gray-500 text-sm"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <p>By continuing, you agree to our</p>
          <div className="flex justify-center gap-4 mt-2">
            <button className="text-gray-400 hover:text-white transition-colors">Terms of Service</button>
            <span>•</span>
            <button className="text-gray-400 hover:text-white transition-colors">Privacy Policy</button>
          </div>
        </div>
      </div>
    </div>
  );
} 