"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { fetchAPI } from "@/lib/apiService";
import { Eye, EyeOff, Lock, User, Mail, Shield, CheckCircle, MapPin, Phone, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    const { data, error } = await fetchAPI({
      endpoint: "employees/login",
      method: "POST",
      data: { username, password },
      revalidateSeconds: 0,
    });

    if (error) {
      setError(error);
      setIsLoading(false);
      return;
    }

    if (data) {
      console.log('Login successful:', data);
      
      // Check if tokens are in the response
      if (data.tokens) {
        // Set cookies manually if needed
        if (data.tokens.access_token) {
          document.cookie = `access_token=${data.tokens.access_token}; path=/; max-age=3600; secure; samesite=strict`;
        }
        if (data.tokens.refresh_token) {
          document.cookie = `refresh_token=${data.tokens.refresh_token}; path=/; max-age=86400; secure; samesite=strict`;
        }
      }
      
      // Redirect to dashboard
      router.push("/");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center  via-background to-primary/10 p-4">
      <div className="w-full max-w-6xl bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
        <div className="flex">
          {/* Left Side - Branding & Welcome */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/8 rounded-full blur-lg"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
              {/* Logo */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-3xl font-bold text-white mb-2">RASTRIYA POSHAK</h1>
                    <p className="text-sm text-white/80 font-medium"></p>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="text-center max-w-md mb-8">
                <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
                <p className="text-lg text-white/90 leading-relaxed">
                  Access your Tailoring management system and streamline your operations
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 w-full max-w-md mb-8">
                <div className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-4 h-4 text-white/70" />
                  <span className="text-sm">Manage Tailoring services and packages</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-4 h-4 text-white/70" />
                  <span className="text-sm">Track deliveries and customer data</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-4 h-4 text-white/70" />
                  <span className="text-sm">Generate reports and analytics</span>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-white/90">Tailoring Services</h3>
                </div>
                
                <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-white/90">Support</h3>
                </div>
                
                <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-white/90">Network</h3>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex justify-between items-center text-white/50 text-xs">
                  <span>© 2024 Rastriya Pokshya Ghar</span>
                  <span>Government of Nepal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-6">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground mb-1">RASTRIYA POSHAK</h1>
                    <p className="text-muted-foreground text-sm">National Tailoring Service</p>
                  </div>
                </div>
              </div>

              {/* Form Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Sign In</h2>
                <p className="text-muted-foreground text-sm">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Login Form */}
              <div className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert 
                      variant="destructive" 
                      title="Login Failed"
                      description={error}
                      dismissible
                      autoDismiss={5000}
                      showProgress
                      sound
                      priority="high"
                      action={{
                        label: "Try Again",
                        onClick: () => setError(null),
                        variant: "default"
                      }}
                      className="mb-4 animate-in slide-in-from-top-4 fade-in-0 zoom-in-95"
                    />
                  )}

                  {/* Username Field */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="h-11 text-base"
                      placeholder="Enter your username"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="h-11 text-base pr-12"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" className="rounded border-border" />
                      Remember me
                    </label>
                    <button type="button" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Need help?{' '}
                    <button className="text-primary hover:text-primary/80 transition-colors font-medium">
                      Contact support
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}