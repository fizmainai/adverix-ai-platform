import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Calendar, MessageSquare, BarChart3, Settings, LogOut, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stats = [
  { label: "Calls Today", value: "0", icon: Phone, change: "+0%" },
  { label: "Appointments", value: "0", icon: Calendar, change: "+0%" },
  { label: "Messages", value: "0", icon: MessageSquare, change: "+0%" },
  { label: "Satisfaction", value: "N/A", icon: BarChart3, change: "" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-heading font-bold text-xl text-foreground hidden sm:block">
                Adverix AI
              </span>
            </Link>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 bg-secondary/50 border-none h-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="icon">
                <LogOut className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-muted-foreground">
            Your 7-day free trial is active. Configure your AI agent to get started.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 md:p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                {stat.change && (
                  <span className="text-xs text-muted-foreground">{stat.change}</span>
                )}
              </div>
              <p className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Setup card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card-strong p-6 md:p-8 glow-primary"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">🤖</span>
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-2">
                Configure Your AI Agent
              </h2>
              <p className="text-muted-foreground mb-4">
                Set up your AI receptionist with your business details, FAQs, and booking preferences.
                It only takes a few minutes!
              </p>
              <Button variant="hero">
                Start Configuration →
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="glass-card p-4 text-left hover:border-primary/50 transition-colors group">
              <Phone className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-foreground">Make a Test Call</p>
              <p className="text-sm text-muted-foreground">Try your AI assistant</p>
            </button>
            <button className="glass-card p-4 text-left hover:border-primary/50 transition-colors group">
              <MessageSquare className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-foreground">Edit Responses</p>
              <p className="text-sm text-muted-foreground">Customize AI answers</p>
            </button>
            <button className="glass-card p-4 text-left hover:border-primary/50 transition-colors group">
              <Calendar className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-foreground">Set Availability</p>
              <p className="text-sm text-muted-foreground">Configure booking hours</p>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
