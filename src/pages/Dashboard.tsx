
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProjectsData } from "@/hooks/useProjectsData";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { ErrorState } from "@/components/dashboard/ErrorState";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ projectId: string; projectName: string } | null>(null);
  
  const { 
    projects, 
    loading, 
    error, 
    isOnline, 
    retryCount, 
    retry, 
    refetch,
    deleteProject,
    deletingProjects
  } = useProjectsData(user?.id);

  const handleNewProject = async () => {
    if (!user) {
      console.log('handleNewProject: No user available');
      toast({
        title: "Authentication Required",
        description: "Please log in to create a project.",
        variant: "destructive",
      });
      return;
    }
    
    if (creating) {
      console.log('handleNewProject: Already creating a project');
      return;
    }

    setCreating(true);
    console.log('handleNewProject: Creating project for user:', user.id);
    
    try {
      const projectName = `New Project ${new Date().toLocaleDateString()}`;
      console.log('handleNewProject: Creating project with name:', projectName);
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          owner: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('handleNewProject: Supabase error:', error);
        toast({
          title: "Creation Failed",
          description: `Failed to create project: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('handleNewProject: Successfully created project:', data);
      
      toast({
        title: "Success",
        description: "Project created successfully!",
      });

      refetch();
      console.log('handleNewProject: Navigating to upload page for project:', data.id);
      navigate(`/project/${data.id}/upload`);
    } catch (error) {
      console.error('handleNewProject: Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!deleteDialog) return;
    
    await deleteProject(projectId);
    setDeleteDialog(null);
  };

  const handleDeleteClick = (projectId: string, projectName: string) => {
    setDeleteDialog({ projectId, projectName });
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <LoadingState retryCount={retryCount} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppNavbar />
        <ErrorState
          error={error}
          isOnline={isOnline}
          retryCount={retryCount}
          onRetry={retry}
          onNewProject={handleNewProject}
          creating={creating}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader
          onNewProject={handleNewProject}
          creating={creating}
          isOnline={isOnline}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteClick}
              isDeleting={deletingProjects.has(project.id)}
            />
          ))}
        </div>

        {projects.length === 0 && !error && (
          <EmptyState
            onNewProject={handleNewProject}
            creating={creating}
            isOnline={isOnline}
          />
        )}
      </div>

      <DeleteProjectDialog
        isOpen={deleteDialog !== null}
        onClose={() => setDeleteDialog(null)}
        onConfirm={() => deleteDialog && handleDeleteProject(deleteDialog.projectId)}
        projectName={deleteDialog?.projectName || ""}
        isDeleting={deleteDialog ? deletingProjects.has(deleteDialog.projectId) : false}
      />
    </div>
  );
};

export default Dashboard;
