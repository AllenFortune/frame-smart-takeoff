
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Calendar, DollarSign, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Project } from "@/hooks/useProjectsData";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string, projectName: string) => void;
  isDeleting: boolean;
}

export const ProjectCard = ({ project, onDelete, isDeleting }: ProjectCardProps) => {
  const navigate = useNavigate();

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

  return (
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
                onDelete(project.id, project.name);
              }}
              disabled={isDeleting}
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
  );
};
