"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { createClient, isSupabaseConfigured } from "@/supabase/client";

export const SUPPORT_EMAIL = "farmrisk.in@gmail.com";

// Same topics and table as the mobile app's feedback section.
const TOPICS = ["General", "Bug Report", "Feature Request", "Data Accuracy", "Other"];

function mailtoLink(topic: string, message: string) {
  const subject = encodeURIComponent(`[FarmRisk Feedback] ${topic}`);
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${encodeURIComponent(message)}`;
}

export function ContactForm() {
  const { user } = useAuth();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setStatus("sending");
    try {
      if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
      // "feedbacks" is not in the generated Database types yet.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (createClient() as any)
        .from("feedbacks")
        .insert({
          topic,
          message: trimmed,
          user_id: user?.id ?? null,
          email: user?.email ?? null,
          phone: (user?.user_metadata?.phone as string) ?? null,
          metadata: { platform: "web" },
        });
      if (error) throw error;
      setStatus("sent");
      setMessage("");
    } catch (err) {
      console.warn("Feedback insert failed:", err);
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <p role="status" className="rounded-lg border p-4">
        Thank you. Your message has been sent.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="topic" className="text-sm font-medium">
          Topic
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <Textarea
          id="message"
          rows={6}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {status === "failed" && (
        <p role="alert" className="text-sm text-red-600">
          We could not send your message.{" "}
          <a href={mailtoLink(topic, message)}>Send it by email instead</a>.
        </p>
      )}
      <Button type="submit" disabled={status === "sending"} className="w-fit">
        {status === "sending" && (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        )}
        Send
      </Button>
    </form>
  );
}
