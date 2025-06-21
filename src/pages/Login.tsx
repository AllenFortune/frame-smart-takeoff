
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // TODO: Implement Supabase magic link authentication
    console.log("Sending magic link to:", email);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Magic link sent!",
        description: "Check your email for the login link",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              FING Framing Estimator
            </CardTitle>
            <CardDescription>
              Sign in to access your framing projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contractor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              We'll send you a secure login link via email
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
