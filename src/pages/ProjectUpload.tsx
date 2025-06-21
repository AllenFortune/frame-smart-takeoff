
import { AppNavbar } from "@/components/AppNavbar";
import { ProjectUploadContent } from "@/components/upload/ProjectUploadContent";

const ProjectUpload = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <ProjectUploadContent />
      </div>
    </div>
  );
};

export default ProjectUpload;
