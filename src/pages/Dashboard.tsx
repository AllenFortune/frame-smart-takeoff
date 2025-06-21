import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Calendar, DollarSign, AlertCircle } from "lucide-react";
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
      console.log('Dashboard: User authenticated, fetching projects for user:', user.id);
      fetchProjects();
    } else {
      console.log('Dashboard: No user authenticated');
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      console.log('Dashboard: Starting to fetch projects...');
      setError(null);
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        console.error('Dashboard: Supabase connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('Dashboard: Supabase connection successful');

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching projects:', error);
        throw error;
      }

      console.log('Dashboard: Successfully fetched projects:', data?.length || 0);
      setProjects(data || []);
    } catch (error) {
      console.error('Dashboard: Error in fetchProjects:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      setError(errorMessage);
      toast({
        title: "Error loading projects",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = async () => {
    if (!user) {
      console.error('Dashboard: No user authenticated for project creation');
      toast({
        title: "Authentication required",
        description: "Please log in to create a project",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Dashboard: Creating new project for user:', user.id);
    setCreating(true);
    
    try {
      const projectName = `New Project ${new Date().toLocaleDateString()}`;
      console.log('Dashboard: Inserting project with name:', projectName);
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          owner: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Dashboard: Error creating project:', error);
        throw error;
      }

      console.log('Dashboard: Project created successfully:', data);
      
      toast({
        title: "Project created!",
        description: "Your new project has been created successfully",
      });

      // Navigate to upload page
      console.log('Dashboard: Navigating to upload page for project:', data.id);
      navigate(`/project/${data.id}/upload`);
    } catch (error) {
      console.error('Dashboard: Error in handleNewProject:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      
      toast({
        title: "Failed to create project",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const retryFetch = () => {
    console.log('Dashboard: Retrying to fetch projects...');
    setLoading(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <Button onClick={retryFetch} variant="outline">
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
            disabled={creating}
          >
            {creating ? (
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
              disabled={creating}
            >
              {creating ? (
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
