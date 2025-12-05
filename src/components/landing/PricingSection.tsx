import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small businesses",
    features: [
      "100 calls/month",
      "1 AI agent",
      "Call recording",
      "Basic analytics",
      "Email support",
    ],
    popular: false,
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing businesses",
    features: [
      "500 calls/month",
      "2 AI agents",
      "WhatsApp integration",
      "Advanced analytics",
      "Priority support",
      "Custom voice",
    ],
    popular: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For large organizations",
    features: [
      "Unlimited calls",
      "Unlimited agents",
      "API access",
      "Dedicated support",
      "Custom integrations",
      "White-label option",
    ],
    popular: false,
    cta: "Contact Sales",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-32 relative">
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
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start with a 7-day free trial. No credit card required.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Reorder for mobile: Professional first */}
          {[plans[1], plans[0], plans[2]].map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative glass-card p-6 md:p-8 ${
                plan.popular
                  ? "border-primary/50 md:scale-105 order-first md:order-none"
                  : ""
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="font-heading font-semibold text-xl text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-heading text-4xl md:text-5xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to={plan.name === "Enterprise" ? "#" : "/register"}>
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
