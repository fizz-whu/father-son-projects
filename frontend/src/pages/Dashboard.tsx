import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import type { Project } from '../types';
import { getProjects } from '../api';

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  totalPhases: number;
  completedPhases: number;
  submittedPhases: number;
  pendingPhases: number;
}

function calculateStats(projects: Project[]): ProjectStats {
  const stats: ProjectStats = {
    total: projects.length,
    active: 0,
    completed: 0,
    totalPhases: 0,
    completedPhases: 0,
    submittedPhases: 0,
    pendingPhases: 0,
  };

  projects.forEach(project => {
    if (project.status === 'completed') {
      stats.completed++;
    } else {
      stats.active++;
    }

    project.phases.forEach(phase => {
      stats.totalPhases++;
      if (phase.status === 'completed') stats.completedPhases++;
      else if (phase.status === 'submitted') stats.submittedPhases++;
      else if (phase.status === 'pending' || phase.status === 'in_progress') stats.pendingPhases++;
    });
  });

  return stats;
}

function getProgressPercentage(project: Project): number {
  if (project.phases.length === 0) {
    return project.status === 'completed' ? 100 : 0;
  }
  const completed = project.phases.filter(p => p.status === 'completed').length;
  return Math.round((completed / project.phases.length) * 100);
}

function getPhaseStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'submitted': return 'bg-yellow-500';
    case 'in_progress': return 'bg-blue-500';
    default: return 'bg-slate-300';
  }
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8 text-slate-600">Loading dashboard...</div>
      </Layout>
    );
  }

  const stats = calculateStats(projects);
  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Progress Dashboard</h1>
        <p className="text-slate-600 mt-1">Track your learning journey</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-sm text-slate-600">Total Projects</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
          <div className="text-sm text-slate-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-slate-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-yellow-600">{stats.submittedPhases}</div>
          <div className="text-sm text-slate-600">Awaiting Review</div>
        </div>
      </div>

      {/* Overall Progress */}
      {stats.totalPhases > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Overall Phase Progress</h2>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${stats.totalPhases > 0 ? (stats.completedPhases / stats.totalPhases) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {stats.completedPhases}/{stats.totalPhases} phases
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600">Completed ({stats.completedPhases})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-slate-600">Submitted ({stats.submittedPhases})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-slate-600">Pending ({stats.pendingPhases})</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Active Projects</h2>
        </div>
        {activeProjects.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No active projects. <Link to="/" className="text-blue-600 hover:underline">Create one</Link>!
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activeProjects.map(project => {
              const progress = getProgressPercentage(project);
              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-slate-800">{project.title}</h3>
                    <span className="text-sm text-slate-600">{progress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Phase indicators */}
                  {project.phases.length > 0 && (
                    <div className="flex gap-1">
                      {project.phases.map(phase => (
                        <div
                          key={phase.id}
                          className={`flex-1 h-1.5 rounded-full ${getPhaseStatusColor(phase.status)}`}
                          title={`${phase.name}: ${phase.status}`}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Completed */}
      {stats.completed > 0 && (
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Completed Projects</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {projects.filter(p => p.status === 'completed').slice(0, 5).map(project => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-slate-800">{project.title}</h3>
                  <p className="text-sm text-slate-500">
                    {project.phases.length} phases completed
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded">
                  Completed
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
