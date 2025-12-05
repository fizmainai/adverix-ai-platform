import { motion } from "framer-motion";
import { Bot, Calendar, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Bot,
    emoji: "🤖",
    title: "24/7 AI Receptionist",
    description: "Your AI answers calls instantly, any time of day or night. No waiting, no voicemail frustration.",
  },
  {
    icon: Calendar,
    emoji: "📅",
    title: "Smart Appointment Booking",
    description: "Automatically schedules appointments, checks availability, and sends confirmations.",
  },
  {
    icon: MessageSquare,
    emoji: "💬",
    title: "Natural Conversations",
    description: "Powered by advanced AI that sounds human and handles complex questions with ease.",
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "Real-Time Dashboard",
    description: "Track every call, read transcripts, and get insights to grow your business.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Never Miss a Call</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to transform your business communication
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 md:p-8 group hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">{feature.emoji}</span>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-xl text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
