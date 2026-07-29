import { readFile, writeFile, mkdir } from "node:fs/promises";
import { marked } from "marked";
import crypto from "node:crypto";

// ── Types ─────────────────────────────────────────────────────────

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface Subscriber {
  email: string;
  signupDate: string;
  lastEmailSent: number; // 0 = signed up, no email yet; 1-5 = which email was last sent
  lastEmailDate: string | null;
}

export interface QueueResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
}

export interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  createdAt: string;
  sent: boolean;
}

// ── Constants ─────────────────────────────────────────────────────

const SEQUENCE_PATH = "/home/team/shared/content/email-sequence.md";
const FROM_ADDRESS = "First Trade Academy <first-trade-academy-7ab0990a@ctomail.io>";
const EMAIL_QUEUE_PATH = "/home/team/shared/data/email-queue.json";

// Timing offsets in hours from signup
const TIMING_HOURS: Record<number, number> = {
  1: 0,   // Email 1: immediately
  2: 48,  // Email 2: day 2
  3: 96,  // Email 3: day 4
  4: 168, // Email 4: day 7
  5: 240, // Email 5: day 10
};

// ── Sequence parser ───────────────────────────────────────────────

/**
 * Parses email-sequence.md into an array of 5 EmailTemplate objects.
 * Each email in the file starts with "## Email N:" and has a subject line
 * formatted as "**Subject line:** ...".
 */
export async function loadEmailSequence(): Promise<EmailTemplate[]> {
  const raw = await readFile(SEQUENCE_PATH, "utf8");

  // Split on "## Email N:" headings (match "## Email 1:", "## Email 2:", etc.)
  const emailBlocks = raw.split(/^## Email \d:.*$/m).slice(1); // first split is before Email 1

  const templates: EmailTemplate[] = [];

  for (const block of emailBlocks) {
    const subjectMatch = block.match(/\*\*Subject line:\*\*\s*(.+)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : "Message from First Trade Academy";

    // Extract body: everything between the first "---" and the last "---" before the next section
    // The body starts after the first horizontal rule
    const parts = block.split(/^---$/m);
    if (parts.length < 2) {
      // Fallback: use the whole block minus the subject line
      let body = block.replace(/\*\*Subject line:\*\*\s*.+/, "").trim();
      templates.push({ subject, html: await markdownToHtml(body) });
      continue;
    }

    // Body is between the first and last "---" separators
    // Skip the header (parts[0] has subject/timing info)
    // The actual email body starts at parts[1] and ends before the footer separator
    let body = "";
    if (parts.length >= 3) {
      // Normal case: header | body | footer | sequence notes
      body = parts.slice(1, parts.length - 1).join("\n---\n").trim();
    } else {
      // Just header and body
      body = parts[1].trim();
    }

    // Clean up: remove the "**Send timing:**" line from body if it leaked through
    body = body.replace(/^\*\*Send timing:\*\*\s*.+\n?/m, "").trim();

    templates.push({ subject, html: await markdownToHtml(body) });
  }

  // We should have exactly 5 emails; pad if needed
  while (templates.length < 5) {
    templates.push({
      subject: `Message ${templates.length + 1} from First Trade Academy`,
      html: "<p>Welcome to First Trade Academy.</p>",
    });
  }

  return templates.slice(0, 5);
}

async function markdownToHtml(md: string): Promise<string> {
  const html = await marked.parse(md);
  // Wrap in a simple email-friendly container
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a2744; line-height: 1.6;">
  ${html}
</body>
</html>`;
}

// ── Email queue ───────────────────────────────────────────────────

/**
 * Queues an email to the file-based queue instead of sending via Resend.
 * Each call appends to `/home/team/shared/data/email-queue.json`.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure the data directory exists
    await mkdir("/home/team/shared/data", { recursive: true });

    // Read existing queue (or start fresh)
    let queue: QueuedEmail[] = [];
    try {
      const raw = await readFile(EMAIL_QUEUE_PATH, "utf8");
      queue = JSON.parse(raw);
    } catch {
      // File doesn't exist or is invalid — start with empty array
    }

    // Append the new email
    const entry: QueuedEmail = {
      id: crypto.randomUUID(),
      to,
      subject,
      html,
      createdAt: new Date().toISOString(),
      sent: false,
    };
    queue.push(entry);

    await writeFile(EMAIL_QUEUE_PATH, JSON.stringify(queue, null, 2), "utf8");

    console.log(`[email] Queued email to ${to} (subject: "${subject}")`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Error queuing email to ${to}:`, message);
    return { success: false, error: message };
  }
}

// ── Timing helpers ────────────────────────────────────────────────

/**
 * Returns the next email number a subscriber is due for, or null if none.
 */
export function getNextEmailDue(subscriber: Subscriber): number | null {
  const now = Date.now();
  const signupTime = new Date(subscriber.signupDate).getTime();

  for (let n = 1; n <= 5; n++) {
    if (subscriber.lastEmailSent >= n) continue;

    const dueOffset = TIMING_HOURS[n] * 60 * 60 * 1000;
    const dueTime = signupTime + dueOffset;

    if (now >= dueTime) {
      return n;
    }
  }

  return null; // all emails sent
}
