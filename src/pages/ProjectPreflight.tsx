
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, FileText, ArrowRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";

const ProjectPreflight = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const planSheets = [
    { id: 1, name: "Foundation Plan", type: "Foundation", scale: "1/4\" = 1'", status: "ok" },
    { id: 2, name: "First Floor Plan", type: "Floor Plan", scale: "1/4\" = 1'", status: "ok" },
    { id: 3, name: "Second Floor Plan", type: "Floor Plan", scale: "1/4\" = 1'", status: "ok" },
    { id: 4, name: "Roof Plan", type: "Roof", scale: "1/4\" = 1'", status: "ok" },
    { id: 5, name: "Elevations", type: "Elevation", scale: "1/4\" = 1'", status: "warning" },
    { id: 6, name: "Sections", type: "Section", scale: "1/4\" = 1'", status: "ok" },
    { id: 7, name: "Details", type: "Detail", scale: "Various", status: "warning" },
  ];

  const alerts = [
    "Scale reference missing on Sheet 5 (Elevations)",
    "Some text may be too small to read clearly on Sheet 7 (Details)",
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                    <span>Detected Plan Sheets ({planSheets.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {planSheets.map((sheet) => (
                    <div
                      key={sheet.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(sheet.status)}
                        <div>
                          <h4 className="font-medium">{sheet.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {sheet.type} • Scale: {sheet.scale}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(sheet.status)}
                    </div>
                  ))}
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
                        {planSheets.filter(s => s.status === 'ok').length}
                      </div>
                      <div className="text-sm text-green-600">Ready</div>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {planSheets.filter(s => s.status === 'warning').length}
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
                onClick={() => navigate(`/project/${id}/specs`)}
                className="w-full rounded-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                Continue to Specs
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
