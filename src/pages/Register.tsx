import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, Check, PartyPopper } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";

const step1Schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.string().min(1, "Please select a business type"),
  phone: z.string().optional(),
  referralSource: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const businessTypes = [
  "Dental Clinic",
  "Veterinary",
  "Restaurant",
  "Contractor",
  "Salon/Spa",
  "Auto Service",
  "Real Estate",
  "Other",
];

const referralSources = [
  "Google Search",
  "Social Media",
  "Friend/Colleague",
  "Blog/Article",
  "Other",
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signInWithGoogle, user, loading } = useAuth();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: formData.fullName || "",
      email: formData.email || "",
      password: formData.password || "",
      confirmPassword: formData.confirmPassword || "",
      terms: formData.terms || false,
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      businessName: formData.businessName || "",
      businessType: formData.businessType || "",
      phone: formData.phone || "",
      referralSource: formData.referralSource || "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const onStep1Submit = (data: Step1Data) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  const onStep2Submit = async (data: Step2Data) => {
    setIsLoading(true);
    const finalData = { ...formData, ...data };
    
    // Sign up with Supabase
    const { error } = await signUp(
      finalData.email!,
      finalData.password!,
      {
        full_name: finalData.fullName,
        business_name: finalData.businessName,
        business_type: finalData.businessType,
      }
    );
    
    if (error) {
      toast({
        title: "Error",
        description: error.message === "User already registered"
          ? "Email already registered. Try signing in instead."
          : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Create profile in database
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.from("profiles").insert({
        user_id: newUser.id,
        business_name: finalData.businessName!,
        business_type: finalData.businessType,
        phone_number: finalData.phone || null,
      });
    }
    
    setFormData(finalData);
    setIsLoading(false);
    setStep(3);
    
    toast({
      title: "Account created!",
      description: "Please check your email to verify your account.",
    });
  };

  const handleGoogleSignUp = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const password = step1Form.watch("password");
  const passwordStrength = getPasswordStrength(password || "");

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthLayout
      sidebarContent={
        <div className="text-center max-w-md">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
            Start Your 7-Day Free Trial
          </h2>
          <p className="text-muted-foreground mb-8">
            Join 500+ businesses already using Adverix AI to transform their customer communication.
          </p>
          
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    s <= step
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 h-1 mx-1 rounded ${
                      s < step ? "bg-gradient-to-r from-primary to-accent" : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            {step === 1 && "Step 1: Create your account"}
            {step === 2 && "Step 2: Tell us about your business"}
            {step === 3 && "Step 3: You're all set!"}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center lg:text-left">
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Start Your 7-Day Free Trial
                </h1>
                <p className="text-muted-foreground">No credit card required</p>
              </div>

              <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      className="pl-12"
                      {...step1Form.register("fullName")}
                    />
                  </div>
                  {step1Form.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {step1Form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-12"
                      {...step1Form.register("email")}
                    />
                  </div>
                  {step1Form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {step1Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-12 pr-12"
                      {...step1Form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {password && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            passwordStrength >= level
                              ? level <= 1
                                ? "bg-destructive"
                                : level <= 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {step1Form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {step1Form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12"
                      {...step1Form.register("confirmPassword")}
                    />
                  </div>
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {step1Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={step1Form.watch("terms")}
                    onCheckedChange={(checked) =>
                      step1Form.setValue("terms", checked as boolean)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link to="#" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="#" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {step1Form.formState.errors.terms && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.terms.message}
                  </p>
                )}

                <Button type="submit" variant="hero" className="w-full">
                  Continue →
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or sign up with</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignUp}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center lg:text-left">
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Tell Us About Your Business
                </h1>
                <p className="text-muted-foreground">This helps your AI give better responses</p>
              </div>

              <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="businessName"
                      placeholder="Your Business Name"
                      className="pl-12"
                      {...step2Form.register("businessName")}
                    />
                  </div>
                  {step2Form.formState.errors.businessName && (
                    <p className="text-sm text-destructive">
                      {step2Form.formState.errors.businessName.message}
                    </p>
                  )}
                </div>

                {/* Business Type */}
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    onValueChange={(value) => step2Form.setValue("businessType", value)}
                    value={step2Form.watch("businessType")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step2Form.formState.errors.businessType && (
                    <p className="text-sm text-destructive">
                      {step2Form.formState.errors.businessType.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="pl-12"
                      {...step2Form.register("phone")}
                    />
                  </div>
                </div>

                {/* Referral Source */}
                <div className="space-y-2">
                  <Label htmlFor="referralSource">How did you hear about us? (optional)</Label>
                  <Select
                    onValueChange={(value) => step2Form.setValue("referralSource", value)}
                    value={step2Form.watch("referralSource")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {referralSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Continue →"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3 - Success */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                <PartyPopper className="w-10 h-10 text-primary-foreground" />
              </div>

              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                  You're All Set! 🎉
                </h1>
                <p className="text-muted-foreground">
                  Your 7-day free trial has started
                </p>
              </div>

              {/* Summary */}
              <div className="glass-card p-6 text-left">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Business</span>
                    <span className="font-medium text-foreground">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial ends</span>
                    <span className="font-medium text-foreground">
                      {trialEndDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="glass-card p-6 text-left">
                <h3 className="font-semibold text-foreground mb-4">What's next?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-foreground">Account created</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">Configure your AI agent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">Make your first test call</span>
                  </div>
                </div>
              </div>

              <Button variant="hero" className="w-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};

export default Register;
