
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Calendar, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  
  const { 
    projects, 
    loading, 
    error, 
    fetchProjects, 
    createProject, 
    reset 
  } = useProjects(userId);

  useEffect(() => {
    if (userId) {
      console.log('Dashboard: User authenticated, fetching projects for user:', userId);
      fetchProjects();
    } else {
      console.log('Dashboard: No user authenticated');
    }
  }, [userId, fetchProjects]);

  const handleNewProject = async () => {
    if (!userId) {
      console.error('Dashboard: No user authenticated for project creation');
      return;
    }
    
    console.log('Dashboard: Creating new project for user:', userId);
    
    const projectName = `New Project ${new Date().toLocaleDateString()}`;
    const newProject = await createProject(projectName);
    
    if (newProject) {
      console.log('Dashboard: Navigating to upload page for project:', newProject.id);
      navigate(`/project/${newProject.id}/upload`);
    }
  };

  const handleRetry = () => {
    console.log('Dashboard: Manual retry requested');
    reset();
    fetchProjects();
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

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Connection Error</h3>
              <p className="text-muted-foreground max-w-md">
                {error}
              </p>
            </div>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
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
          <Button
            onClick={handleNewProject}
            className="rounded-full bg-primary hover:bg-primary/90"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </>
            )}
          </Button>
        </div>

        {error && projects.length > 0 && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">
                Connection issues detected. Showing cached projects.
              </p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => navigate(`/project/${project.id}/preflight`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <FolderOpen className="w-8 h-8 text-primary" />
                  <Badge className={getStatusColor("In Progress")}>
                    In Progress
                  </Badge>
                </div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground">
                    0 sheets
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
              className="rounded-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Project
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
