import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Calendar, DollarSign, AlertTriangle, Wifi, WifiOff, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProjectsData } from "@/hooks/useProjectsData";
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog";

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

      // Refresh projects list
      refetch();

      // Navigate to upload page
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Complete":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
            {retryCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Retry attempt {retryCount}/{3}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              {isOnline ? (
                <AlertTriangle className="w-16 h-16 text-red-500" />
              ) : (
                <WifiOff className="w-16 h-16 text-red-500" />
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2 text-red-600">
              {isOnline ? "Failed to Load Projects" : "No Internet Connection"}
            </h3>
            
            <p className="text-muted-foreground mb-4">{error}</p>
            
            {retryCount > 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                Attempted {retryCount} time{retryCount !== 1 ? 's' : ''}
              </p>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button onClick={retry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button onClick={handleNewProject} disabled={creating || !isOnline}>
                <Plus className="w-4 h-4 mr-2" />
                {creating ? "Creating..." : "New Project"}
              </Button>
            </div>
            
            <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
              {isOnline ? (
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-500" />
                  Connected
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-red-500" />
                  Offline
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Projects</h1>
            <p className="text-muted-foreground mt-2">
              Manage your framing estimates and takeoffs
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!isOnline && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <WifiOff className="w-4 h-4" />
                Offline
              </div>
            )}
            <Button
              onClick={handleNewProject}
              disabled={creating || !isOnline}
              className="rounded-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {creating ? "Creating..." : "New Project"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <FolderOpen className="w-8 h-8 text-primary" />
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor("In Progress")}>
                      In Progress
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog({ projectId: project.id, projectName: project.name });
                      }}
                      disabled={deletingProjects.has(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
              </CardHeader>
              <CardContent 
                className="space-y-3"
                onClick={() => navigate(`/project/${project.id}/upload`)}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground">
                    {project.sheet_count} {project.sheet_count === 1 ? 'sheet' : 'sheets'}
                  </div>
                </div>
                <div className="flex items-center text-lg font-semibold text-secondary">
                  <DollarSign className="w-5 h-5 mr-1" />
                  Pending
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && !error && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first framing estimate to get started
            </p>
            <Button
              onClick={handleNewProject}
              disabled={creating || !isOnline}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              {creating ? "Creating..." : "Create First Project"}
            </Button>
          </div>
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
