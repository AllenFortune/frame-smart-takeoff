
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
}

interface ExistingPlansDisplayProps {
  projectId: string;
  pages: PlanPage[];
  loading: boolean;
}

export const ExistingPlansDisplay = ({ projectId, pages, loading }: ExistingPlansDisplayProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading existing plans...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pages.length === 0) {
    return (
      <Card className="mb-6 border-dashed">
        <CardContent className="p-6 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No plans uploaded yet</p>
          <p className="text-sm text-muted-foreground">Upload your first PDF to get started</p>
        </CardContent>
      </Card>
    );
  }

  const planTypes = pages.reduce((acc, page) => {
    const type = page.class || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Floor Plan': 'bg-blue-100 text-blue-800',
      'Roof Plan': 'bg-green-100 text-green-800',
      'Foundation Plan': 'bg-orange-100 text-orange-800',
      'Elevation': 'bg-purple-100 text-purple-800',
      'Section': 'bg-yellow-100 text-yellow-800',
      'Detail': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Existing Plans ({pages.length} {pages.length === 1 ? 'page' : 'pages'})
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/project/${projectId}/pages`)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/project/${projectId}/wizard`)}
              className="flex items-center gap-1"
            >
              Continue to Wizard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(planTypes).map(([type, count]) => (
              <Badge key={type} variant="secondary" className={getTypeColor(type)}>
                {type}: {count}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Your plans have been processed and classified. You can add more files below or continue to the wizard to start your takeoff.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
