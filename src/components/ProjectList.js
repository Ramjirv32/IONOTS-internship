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

  // ... rest of your component code ...
}

