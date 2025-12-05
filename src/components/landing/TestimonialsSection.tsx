import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Adverix AI saved us 30 hours a week. Our patients love the instant response!",
    author: "Dr. Sarah M.",
    role: "Dental Clinic",
    avatar: "👩‍⚕️",
  },
  {
    quote: "We never miss a lead now. Best investment for our contracting business.",
    author: "Mike R.",
    role: "Home Services",
    avatar: "👷",
  },
  {
    quote: "Setup took 10 minutes. Now our salon runs smoother than ever.",
    author: "Lisa T.",
    role: "Beauty Salon",
    avatar: "💇‍♀️",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 bg-secondary/30 relative overflow-hidden">
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
            Trusted by <span className="gradient-text">Growing Businesses</span>
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 md:p-8"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-lg">{testimonial.avatar}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {testimonial.author}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logo strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-6">
            Trusted by businesses across industries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-50">
            {["🏥 Healthcare", "🏠 Home Services", "💈 Beauty", "🍽️ Restaurants", "🚗 Auto"].map(
              (industry) => (
                <span key={industry} className="text-muted-foreground text-sm font-medium">
                  {industry}
                </span>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
