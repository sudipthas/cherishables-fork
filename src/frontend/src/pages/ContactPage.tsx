import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveLead } from "@/hooks/useAdmin";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const saveLead = useSaveLead();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveLead.mutate(
      {
        name: form.name,
        phone: form.phone,
        email: form.email,
        subject: form.subject,
        message: form.message,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success("Message sent successfully!");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to send message",
          );
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-card border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Have a question about your order, a custom request, or just want
              to say hello? We are here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Info Cards */}
          <div className="space-y-4">
            {[
              {
                icon: Phone,
                title: "Phone",
                lines: ["+91 84312 74009", "Mon-Sat, 10am - 7pm IST"],
              },
              {
                icon: Mail,
                title: "Email",
                lines: ["orders@cherishables.in", "support@cherishables.in"],
              },
              {
                icon: MessageCircle,
                title: "WhatsApp",
                lines: ["+91 84312 74009", "Fastest response time"],
              },
              {
                icon: MapPin,
                title: "Studio",
                lines: [
                  "No. 42, 1st Floor, 4th Cross, 5th Block",
                  "Koramangala, Bangalore, Karnataka 560095",
                ],
              },
            ].map((item) => (
              <div key={item.title} className="bg-card border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold">{item.title}</h3>
                </div>
                {item.lines.map((line) => (
                  <p key={line} className="text-muted-foreground text-sm pl-8">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-xl p-6 md:p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                  data-ocid="contact.success_state"
                >
                  <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">
                    Message Sent
                  </h3>
                  <p className="text-muted-foreground">
                    We will get back to you within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-medium mb-1"
                      >
                        Name
                      </label>
                      <Input
                        id="contact-name"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        data-ocid="contact.name_input"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium mb-1"
                      >
                        Email
                      </label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        data-ocid="contact.email_input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-sm font-medium mb-1"
                      >
                        Phone
                      </label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        data-ocid="contact.phone_input"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-subject"
                        className="block text-sm font-medium mb-1"
                      >
                        Subject
                      </label>
                      <Input
                        id="contact-subject"
                        required
                        value={form.subject}
                        onChange={(e) =>
                          setForm({ ...form, subject: e.target.value })
                        }
                        data-ocid="contact.subject_input"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-sm font-medium mb-1"
                    >
                      Message
                    </label>
                    <Textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      data-ocid="contact.message_textarea"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={saveLead.isPending}
                    data-ocid="contact.submit_button"
                  >
                    {saveLead.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
