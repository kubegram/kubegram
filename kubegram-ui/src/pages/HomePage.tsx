import React, { useState, useEffect } from 'react';
import { Plus, Search, User, MoreHorizontal, Settings, LogOut, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createNewProject,
  saveCurrentAsPrevious,
  loadAllProjects,
  setProject,
  removeProject,
  saveActiveProjectToStorage,
} from '@/store/slices/project/projectSlice';
import type { Project } from '@/types/canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const HomePage = () => {
  const user = {
    name: 'Saleh Shehata',
    email: 'sshehata@fun.com',
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const allProjects = useAppSelector((state) => state.project.projects);
  const currentProject = useAppSelector((state) => state.project.project);
  const [searchTerm, setSearchTerm] = useState('');

  // Load all projects from localStorage on mount
  useEffect(() => {
    dispatch(loadAllProjects());
  }, [dispatch]);

  // Filter projects by search, exclude the currently active project
  const filteredProjects = allProjects
    .filter((p) => p.id !== currentProject?.id)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleLogout = () => {
    navigate('/');
  };

  const handleCreateNewProject = () => {
    // Persist the current project's latest state before switching
    if (currentProject) {
      saveActiveProjectToStorage(currentProject);
    }

    dispatch(saveCurrentAsPrevious());
    dispatch(createNewProject());
    navigate('/app');
  };

  const handleLoadProject = (project: Project) => {
    // Persist the current project's latest state before switching
    if (currentProject) {
      saveActiveProjectToStorage(currentProject);
    }

    dispatch(saveCurrentAsPrevious());
    dispatch(setProject(project));
    saveActiveProjectToStorage(project);
    navigate('/app');
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this project?');
    if (confirmed) {
      dispatch(removeProject(projectId));
    }
  };

  const nodeCount = (project: Project): number => {
    const nodes = project.graph?.nodes;
    if (!nodes) return 0;
    return nodes.filter(Boolean).length;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-10 bg-[#1c1c1c] border-[#2a2a2a] w-full text-white placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    {user?.email && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold">Projects</h1>
                <p className="text-muted-foreground">Manage your projects and templates</p>
              </div>
              <Button onClick={handleCreateNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </div>

            {/* Current Project */}
            {currentProject && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Project</h2>
                <Card
                  className="group overflow-hidden bg-[#1c1c1c] border-[#7a44acff] cursor-pointer max-w-sm"
                  onClick={() => navigate('/app')}
                >
                  <div className="h-32 bg-[#2a2a2a] group-hover:bg-[#333] transition-colors relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <span className="text-4xl font-bold opacity-20">{nodeCount(currentProject)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-white truncate">{currentProject.name}</h3>
                    <p className="text-sm text-gray-400">{nodeCount(currentProject)} nodes</p>
                  </div>
                </Card>
              </div>
            )}

            {/* Previous Projects */}
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {searchTerm ? 'Search Results' : 'Previous Projects'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Project Card */}
              <Card
                className="group border-2 border-dashed border-[#2a2a2a] bg-[#1c1c1c] hover:border-[#7a44acff] transition-colors cursor-pointer"
                onClick={handleCreateNewProject}
              >
                <div className="h-48 flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#7a44acff] mb-4 group-hover:bg-[#333] transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-white">Create New Project</h3>
                  <p className="text-sm text-gray-400 mt-1">Start from scratch or use a template</p>
                </div>
              </Card>

              {/* Previous Project Cards */}
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group overflow-hidden bg-[#1c1c1c] border-[#2a2a2a] hover:border-[#7a44acff] transition-colors cursor-pointer"
                  onClick={() => handleLoadProject(project)}
                >
                  <div className="h-32 bg-[#2a2a2a] group-hover:bg-[#333] transition-colors relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <span className="text-4xl font-bold opacity-20">{nodeCount(project)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{project.name}</h3>
                        <p className="text-sm text-gray-400">{nodeCount(project)} nodes</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLoadProject(project); }}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            <span>Open</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400"
                            onClick={(e) => handleDeleteProject(e, project.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty States */}
            {filteredProjects.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No projects match &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body, #root {
            height: 100%;
            background-color: #121212;
          }
        `
      }} />
    </div>
  );
};

export default HomePage;