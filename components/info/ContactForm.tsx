"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getInfoContent, type TopicKey } from "@/constants/infoPages";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { createClient, isSupabaseConfigured } from "@/supabase/client";

export const SUPPORT_EMAIL = "farmrisk.in@gmail.com";

// Same topics and table as the mobile app's feedback section. The English
// value is what gets stored; the label is translated for display.
const TOPICS: { key: TopicKey; value: string }[] = [
  { key: "general", value: "General" },
  { key: "bugReport", value: "Bug Report" },
  { key: "featureRequest", value: "Feature Request" },
  { key: "dataAccuracy", value: "Data Accuracy" },
  { key: "other", value: "Other" },
];

function mailtoLink(topic: string, message: string) {
  const subject = encodeURIComponent(`[FarmRisk Feedback] ${topic}`);
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${encodeURIComponent(message)}`;
}

export function ContactForm() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { form } = getInfoContent(language).contact;
  const [topic, setTopic] = useState(TOPICS[0].value);
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
        {form.sent}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="topic" className="text-sm font-medium">
          {form.topicLabel}
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          {TOPICS.map((t) => (
            <option key={t.key} value={t.value}>
              {form.topics[t.key]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="message" className="text-sm font-medium">
          {form.messageLabel}
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
          {form.failed.before}{" "}
          <a href={mailtoLink(topic, message)}>{form.failed.link}</a>
          {form.failed.after}
        </p>
      )}
      <Button type="submit" disabled={status === "sending"} className="w-fit">
        {status === "sending" && (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        )}
        {form.send}
      </Button>
    </form>
  );
}
