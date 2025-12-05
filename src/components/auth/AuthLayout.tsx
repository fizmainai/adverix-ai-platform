import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

const AuthLayout = ({ children, showSidebar = true, sidebarContent }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding (desktop only) */}
      {showSidebar && (
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden hero-gradient">
          {/* Background effects */}
          <div className="absolute inset-0">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-3xl"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full">
            <Link to="/" className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">A</span>
              </div>
              <span className="font-heading font-bold text-3xl text-foreground">Adverix AI</span>
            </Link>
            
            {sidebarContent || (
              <>
                <div className="text-center max-w-md">
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                    Welcome back!
                  </h2>
                  <p className="text-muted-foreground">
                    Your AI assistant is ready to help you manage calls and delight customers.
                  </p>
                </div>

                {/* Visual element */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 glass-card p-6 max-w-sm"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-xl">🤖</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">AI Assistant</p>
                      <p className="text-xs text-accent">Online</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    "Ready to handle your calls 24/7!"
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Right side - Form */}
      <div className={`flex-1 flex flex-col ${showSidebar ? 'lg:w-1/2' : 'w-full'}`}>
        {/* Mobile logo */}
        <div className="lg:hidden p-6 flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">Adverix AI</span>
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
