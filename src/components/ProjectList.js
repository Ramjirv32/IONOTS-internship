/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import axios from 'axios';
import Leaderboard from './Leaderboard';

const API_URL = 'https://ionots-internship.vercel.app';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects?userId=${auth.currentUser.uid}`);
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowTaskModal(true);
  };

  const ProjectCard = ({ project }) => (
    <div 
      onClick={() => handleProjectClick(project)}
      className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6 hover:transform hover:scale-[1.02] transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{project.name}</h3>
        <span className="text-2xl font-bold text-yellow-500">{project.score}pts</span>
      </div>
      
      <p className="text-gray-400 mb-4">{project.description}</p>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
        <span className={`px-3 py-1 rounded-full text-sm ${
          project.status === "Completed" ? "bg-green-500/20 text-green-300" :
          project.status === "Accepted" ? "bg-yellow-500/20 text-yellow-300" :
          "bg-blue-500/20 text-blue-300"
        }`}>
          {project.status}
        </span>
        <p className="text-sm text-gray-500">
          Due {new Date(project.deadline).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8 font-['Space_Grotesk']">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white">My Projects</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-400">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
              </p>
              <span className="text-yellow-500 font-bold">
                Total Score: {projects.reduce((sum, project) => sum + (project.score || 0), 0)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="px-6 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              🏆 Leaderboard
            </button>
            <button 
              onClick={handleSignOut}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No projects yet</p>
            <p className="text-gray-500">Click "Add New Project" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {showTaskModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedProject.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedProject.description}</p>
                </div>
                <button 
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="text-center text-gray-400">
                Current Score: <span className="text-yellow-500 font-bold">{selectedProject.score}</span>
              </div>
            </div>
          </div>
        )}

        <Leaderboard 
          isOpen={showLeaderboard} 
          onClose={() => setShowLeaderboard(false)} 
        />
      </div>
    </div>
  );
}

