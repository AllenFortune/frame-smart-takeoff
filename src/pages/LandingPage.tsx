
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FileText, Zap, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calculator,
      title: "Automated Calculations",
      description: "AI-powered framing estimates with precision and speed"
    },
    {
      icon: FileText,
      title: "Plan Analysis",
      description: "Upload construction plans and get instant classification"
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Get your estimates in minutes, not hours"
    },
    {
      icon: CheckCircle,
      title: "Accurate Results",
      description: "Industry-tested algorithms for reliable estimates"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            FING Framing Estimator
          </h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Professional Framing Estimates
            <span className="text-primary block mt-2">Powered by AI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Transform your construction plans into accurate framing estimates in minutes. 
            Upload your blueprints and let our AI do the heavy lifting.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="rounded-full bg-primary hover:bg-primary/90 px-8"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="rounded-full px-8"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Why Choose FING?
          </h2>
          <p className="text-lg text-muted-foreground">
            Professional-grade tools designed for contractors and estimators
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="rounded-2xl shadow-lg border-0 bg-background/50">
              <CardHeader className="text-center pb-2">
                <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of contractors who trust FING for their framing estimates.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="rounded-full bg-primary hover:bg-primary/90 px-8"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 FING Framing Estimator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
