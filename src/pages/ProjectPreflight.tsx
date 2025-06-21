import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, FileText, ArrowRight, ArrowLeft, Home } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useProjectData } from "@/hooks/useProjectData";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb";

const ProjectPreflight = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, pages, loading, error } = useProjectData(id!);

  const getPageStatus = (page: any) => {
    // Simple logic to determine page status based on confidence
    if (page.confidence >= 0.8) return "ok";
    if (page.confidence >= 0.5) return "warning";
    return "error";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Check</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
  };

  const getPageTypeName = (className: string) => {
    switch (className.toLowerCase()) {
      case 'foundation':
        return 'Foundation Plan';
      case 'floor':
        return 'Floor Plan';
      case 'roof':
        return 'Roof Plan';
      case 'elevation':
        return 'Elevations';
      case 'section':
        return 'Sections';
      case 'detail':
        return 'Details';
      default:
        return className;
    }
  };

  // Generate alerts based on actual page data
  const generateAlerts = () => {
    const alerts = [];
    pages.forEach(page => {
      const status = getPageStatus(page);
      if (status === 'warning') {
        alerts.push(`Low confidence (${Math.round(page.confidence * 100)}%) on ${getPageTypeName(page.class)}`);
      } else if (status === 'error') {
        alerts.push(`Very low confidence (${Math.round(page.confidence * 100)}%) on ${getPageTypeName(page.class)} - may need review`);
      }
    });
    return alerts;
  };

  const alerts = generateAlerts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project data...</p>
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
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Project</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
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
        <div className="max-w-4xl mx-auto">
          {/* Navigation Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={() => navigate('/dashboard')} className="cursor-pointer">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={() => navigate(`/project/${id}/upload`)} className="cursor-pointer">
                      {project?.name || 'Project'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Pre-flight Scan</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/project/${id}/upload`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Upload
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Pre-flight Scan</h1>
            <p className="text-muted-foreground">
              Review detected plan sheets and resolve any issues before proceeding
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-primary" />
                    <span>Detected Plan Sheets ({pages.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pages.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No plan sheets detected yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate(`/project/${id}/upload`)}
                      >
                        Upload Plans
                      </Button>
                    </div>
                  ) : (
                    pages.map((page) => {
                      const status = getPageStatus(page);
                      return (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(status)}
                            <div>
                              <h4 className="font-medium">{getPageTypeName(page.class)}</h4>
                              <p className="text-sm text-muted-foreground">
                                Page {page.page_no} • Confidence: {Math.round(page.confidence * 100)}%
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {pages.filter(p => getPageStatus(p) === 'ok').length}
                      </div>
                      <div className="text-sm text-green-600">Ready</div>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {pages.filter(p => getPageStatus(p) === 'warning').length}
                      </div>
                      <div className="text-sm text-yellow-600">Warnings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {alerts.length > 0 && (
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <span>Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.map((alert, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{alert}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={() => navigate(`/project/${id}/wizard`)}
                className="w-full rounded-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={pages.length === 0}
              >
                Continue to Wizard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreflight;
