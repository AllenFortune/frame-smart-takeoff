
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      console.log('Dashboard: User authenticated, ID:', user.id);
      fetchProjects();
    } else {
      console.log('Dashboard: No authenticated user');
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) {
      console.log('fetchProjects: No user available');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      console.log('fetchProjects: Fetching projects for user:', user.id);
      setError(null);
      
      // First check if we can access the projects table at all
      const { data, error, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('owner', user.id)
        .order('created_at', { ascending: false });

      console.log('fetchProjects: Query result:', { data, error, count });

      if (error) {
        console.error('fetchProjects: Supabase error:', error);
        setError(`Database error: ${error.message}`);
        toast({
          title: "Database Error",
          description: `Failed to load projects: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('fetchProjects: Successfully fetched', data?.length || 0, 'projects');
      setProjects(data || []);
    } catch (error) {
      console.error('fetchProjects: Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      await fetchProjects();

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

  const handleRetry = () => {
    setError(null);
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
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
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-600">Failed to Load Projects</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
              <Button onClick={handleNewProject} disabled={creating}>
                <Plus className="w-4 h-4 mr-2" />
                {creating ? "Creating..." : "New Project"}
              </Button>
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
          <Button
            onClick={handleNewProject}
            disabled={creating}
            className="rounded-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            {creating ? "Creating..." : "New Project"}
          </Button>
        </div>

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
              disabled={creating}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              {creating ? "Creating..." : "Create First Project"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
