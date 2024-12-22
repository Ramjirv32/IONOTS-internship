import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import axios from 'axios';
import Leaderboard from './Leaderboard';

const API_URL = 'https://ionots-internship-git-main-ramjib2311-gmailcoms-projects.vercel.app';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tech: '',
    status: 'In Progress',
    progress: 0,
    score: 0,
    tasks: [
      { title: 'Setup Project', completed: false },
      { title: 'Implement Core Features', completed: false },
      { title: 'Testing', completed: false },
      { title: 'Documentation', completed: false },
      { title: 'Deployment', completed: false }
    ]
  });

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userId = auth.currentUser.uid;
      
      // Simulate progress
      for (let i = 20; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await axios.post('http://localhost:8001/api/projects', {
        name: newProject.title,
        description: newProject.description,
        status: 'Pending',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      });

      await fetchProjects();
      setIsModalOpen(false);
      setNewProject({
        title: '',
        description: '',
        status: 'Pending'
      });
    } catch (error) {
      console.error("Error adding project:", error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getProjectTasks = (projectName) => {
    const tasksList = {
      'Mobile App Development': [
        { id: 1, title: 'Setup React Native Environment', points: 20 },
        { id: 2, title: 'Implement User Authentication', points: 20 },
        { id: 3, title: 'Create Offline Data Storage', points: 20 },
        { id: 4, title: 'Implement Real-time Sync', points: 20 },
        { id: 5, title: 'Deploy to App Stores', points: 20 }
      ],
      'Data Analytics Dashboard': [
        { id: 1, title: 'Setup Dashboard Layout', points: 20 },
        { id: 2, title: 'Implement Data Visualization', points: 20 },
        { id: 3, title: 'Add Filtering System', points: 20 },
        { id: 4, title: 'Create Export Functionality', points: 20 },
        { id: 5, title: 'Optimize Performance', points: 20 }
      ],
      'E-commerce Platform': [
        { id: 1, title: 'Create Product Catalog', points: 20 },
        { id: 2, title: 'Implement Shopping Cart', points: 20 },
        { id: 3, title: 'Add Payment Integration', points: 20 },
        { id: 4, title: 'Setup Order Management', points: 20 },
        { id: 5, title: 'Deploy and Test', points: 20 }
      ]
    };
    return tasksList[projectName] || [
      { id: 1, title: 'Planning and Setup', points: 20 },
      { id: 2, title: 'Core Implementation', points: 20 },
      { id: 3, title: 'Testing', points: 20 },
      { id: 4, title: 'Documentation', points: 20 },
      { id: 5, title: 'Deployment', points: 20 }
    ];
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setTasks(getProjectTasks(project.name).map(task => ({
      ...task,
      completed: false,
      progress: 0
    })));
    setShowTaskModal(true);
  };

  const handleTaskUpdate = async (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, progress: Math.min(task.progress + 20, 100) } : task
    );
    setTasks(updatedTasks);

    // Calculate overall progress and score
    const totalProgress = Math.floor(updatedTasks.reduce((sum, task) => sum + task.progress, 0) / updatedTasks.length);
    const score = updatedTasks.reduce((sum, task) => sum + (task.progress === 100 ? task.points : 0), 0);

    try {
      await axios.post('http://localhost:8001/api/progress/update', {
        project_id: selectedProject.id,
        candidate_id: auth.currentUser.uid,
        progress: totalProgress,
        score
      });

      // Update the selected project's progress and score
      setSelectedProject(prevProject => ({
        ...prevProject,
        progress: totalProgress,
        score
      }));

      // Show completion message if all tasks are done
      if (totalProgress === 100) {
        alert('Congratulations! You have completed all tasks!');
        setShowTaskModal(false);
      }

      await fetchProjects(); // Refresh projects list
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Render project card with progress tracking
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
      
      {/* Progress bar */}
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
        {/* Header with total score */}
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

        {/* Project grid */}
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

        {/* Task Modal */}
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

              <div className="space-y-4 mb-6">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className={`text-sm ${task.progress === 100 ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">{task.points} points</p>
                        <p className="text-xs text-gray-500">{task.progress}% complete</p>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleTaskUpdate(task.id)}
                      disabled={task.progress >= 100}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      Update
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Total Progress</span>
                <span>{selectedProject.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${selectedProject.progress}%` }}
                />
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

