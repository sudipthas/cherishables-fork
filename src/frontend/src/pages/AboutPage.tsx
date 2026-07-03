import { Skeleton } from "@/components/ui/skeleton";
import { Award, Heart, Shield, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useActiveTeamMembers } from "../hooks/useTeamMembers";

const VALUES = [
  {
    icon: Heart,
    title: "Handcrafted with Love",
    desc: "Every piece is sculpted, painted, and finished by skilled artisans who treat your memories as their own.",
  },
  {
    icon: Shield,
    title: "Premium Quality",
    desc: "We use only high-grade resin and archival-safe paints to ensure your miniature lasts a lifetime.",
  },
  {
    icon: Truck,
    title: "Safe Delivery",
    desc: "Each item is carefully packed in custom foam inserts and shipped with full insurance coverage.",
  },
  {
    icon: Award,
    title: "Satisfaction Guaranteed",
    desc: "Not happy with the preview? We revise until you love it. Your approval is required before we print.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Upload Photos",
    desc: "Share clear front and side photos of the subject.",
  },
  {
    step: "2",
    title: "Design & Preview",
    desc: "Our artists sculpt a 3D model and send you a preview.",
  },
  {
    step: "3",
    title: "Your Approval",
    desc: "Request changes or approve the design to proceed.",
  },
  {
    step: "4",
    title: "Print & Paint",
    desc: "We 3D print, hand-paint, and finish your miniature.",
  },
  {
    step: "5",
    title: "Ship & Cherish",
    desc: "Carefully packed and shipped to your doorstep.",
  },
];

function TeamSection() {
  const { data: members, isLoading, error } = useActiveTeamMembers();

  if (isLoading) {
    return (
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-center mb-10">
            Meet the Founders
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 snap-center flex flex-col items-center"
              >
                <Skeleton className="w-32 h-32 rounded-full mb-4" />
                <Skeleton className="w-32 h-5 rounded mb-2" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !members || members.length === 0) {
    return null;
  }

  return (
    <section className="bg-muted/30 border-y" data-ocid="team.section">
      <div className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-center mb-10">
          Meet the Founders
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:justify-center md:overflow-visible md:snap-none">
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex-shrink-0 w-64 snap-center flex flex-col items-center text-center"
              data-ocid={`team.item.${idx + 1}`}
            >
              <div className="portrait-ring mb-4">
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-32 h-32 object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {member.name}
              </h3>
              <p className="text-muted-foreground text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-card border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              About Cherishables
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We turn your most precious photos into handcrafted 3D miniatures
              and personalized gifts. Founded with a passion for preserving
              memories in tangible form, every piece we create is a labor of
              love.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-center mb-10">
          Why Choose Us
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v, idx) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border rounded-xl p-6 text-center"
            >
              <v.icon className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">
                {v.title}
              </h3>
              <p className="text-muted-foreground text-sm">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((s, idx) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border rounded-xl p-6 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-display text-base font-semibold mb-2">
                  {s.title}
                </h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <TeamSection />

      {/* Story */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Cherishables began with a simple idea: what if you could hold your
            memories in your hands? What started as a small studio crafting
            custom couple figurines has grown into a trusted brand serving
            thousands of customers across India.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Today, we specialize in couple miniatures, family figurines, pet
            replicas, corporate gifts, and personalized keepsakes. Every order
            is handled with the same care as our very first.
          </p>
        </div>
      </section>
    </div>
  );
}
