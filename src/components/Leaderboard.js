import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function Leaderboard({ isOpen, onClose }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      // Show welcome toast when leaderboard opens
      Swal.fire({
        title: '🏆 Leaderboard',
        text: 'Check out the top performers!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1f2937',
        color: '#fff'
      });
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/leaderboard`);
      setLeaders(response.data);
      
      // Show achievement toast if user is in top 3
      const userRank = response.data.findIndex(leader => 
        leader.candidate_id === auth.currentUser?.uid
      );
      
      if (userRank >= 0 && userRank < 3) {
        const medals = ['🥇', '🥈', '🥉'];
        Swal.fire({
          title: `Congratulations! ${medals[userRank]}`,
          text: `You're #${userRank + 1} on the leaderboard!`,
          icon: 'success',
          confirmButtonText: 'Thanks!',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#3b82f6'
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaders = filter === 'top' 
    ? leaders.filter(leader => leader.total_score > 0).slice(0, 10)
    : leaders;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-700/50"
        data-aos="zoom-in"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🏆 Users & Rankings</h2>
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-3 py-1 text-sm border border-gray-700"
            >
              <option value="all">All Users</option>
              <option value="top">Top 10</option>
            </select>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">
            {error}
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {filteredLeaders.map((leader, index) => (
              <div 
                key={leader.candidate_id}
                className={`bg-gray-800/50 rounded-lg p-4 flex items-center gap-4 ${
                  leader.candidate_id === auth.currentUser?.uid ? 'border-2 border-yellow-500/50' : ''
                } hover:bg-gray-800 transition-colors`}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {leader.photo_url ? (
                  <img 
                    src={leader.photo_url} 
                    alt="User"
                    className="w-10 h-10 rounded-full ring-2 ring-offset-2 ring-offset-gray-900 ring-gray-700"
                  />
                ) : (
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold
                    transform transition-transform hover:scale-110
                    ${index === 0 ? 'bg-yellow-500 text-black' : 
                      index === 1 ? 'bg-gray-300 text-black' :
                      index === 2 ? 'bg-amber-600 text-black' :
                      'bg-gray-700 text-gray-300'}
                  `}>
                    {leader.display_name?.[0] || '#'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {leader.display_name || `User ${leader.candidate_id.slice(0, 6)}`}
                      </span>
                      {leader.candidate_id === auth.currentUser?.uid && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full animate-pulse">
                          You
                        </span>
                      )}
                      {index < 3 && (
                        <span className="text-lg" data-aos="zoom-in">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                    <span className="text-yellow-500 font-bold">{leader.total_score} pts</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-gray-400">
                    <span>{leader.projects_completed} projects completed</span>
                    <span>Last active: {new Date(leader.last_activity || leader.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 