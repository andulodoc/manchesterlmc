# Custom SMTP Setup — Manchester LMC

Replaces Supabase's built-in email sender (limited to 4/hour) with Resend,
a transactional email service with a free tier of 3,000 emails/month (100/day).

**Prerequisite:** Access to the DNS settings for `manchesterlmc.co.uk`.

---

## Step 1 — Create a Resend account

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. In the Resend dashboard, go to **Domains → Add Domain**
3. Enter `manchesterlmc.co.uk`
4. Resend will display a set of DNS records to add — keep this tab open for Step 2

---

## Step 2 — Add DNS records

Log in to your domain registrar (wherever `manchesterlmc.co.uk` is managed) and add the records Resend provides. They will look something like:

| Type | Name | Value |
|---|---|---|
| TXT | `@` or `manchesterlmc.co.uk` | `v=spf1 include:amazonses.com ~all` |
| CNAME | `resend._domainkey` | `resend._domainkey.resend.com` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

> The exact values will be shown in your Resend dashboard — use those, not the examples above.

Once added, click **Verify** in Resend. DNS propagation usually takes a few minutes but can take up to an hour.

---

## Step 3 — Create a Resend API key

1. In Resend, go to **API Keys → Create API Key**
2. Name it `manchesterlmc-supabase`
3. Set permission to **Sending access** only
4. Copy the key — you will only see it once

---

## Step 4 — Configure Supabase SMTP

1. Go to [supabase.com](https://supabase.com) → your project → **Project Settings → Auth**
2. Scroll down to **SMTP Settings**
3. Toggle **Enable Custom SMTP** on
4. Fill in the following:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | *(your Resend API key from Step 3)* |
| Sender name | `Manchester LMC` |
| Sender email | `noreply@manchesterlmc.co.uk` |

5. Click **Save**

---

## Step 5 — Send a test email

On the same Supabase SMTP settings page, use the **Send test email** button to confirm delivery. Check your inbox (and spam folder) for the test message.

---

## Step 6 — Check Supabase email templates (optional)

While in **Project Settings → Auth**, click **Email Templates** to review and customise:

- **Confirm signup** — sent when a new member registers
- **Reset password** — sent when a member requests a password reset
- **Magic Link** — not used but can be disabled

Update the template wording to match the Manchester LMC tone if desired. The `{{ .ConfirmationURL }}` variable is inserted by Supabase automatically.

---

## Ongoing limits

| Plan | Monthly emails | Daily limit |
|---|---|---|
| Resend free | 3,000 | 100 |
| Resend Pro ($20/mo) | 50,000 | No daily limit |

At ~400 members, the free tier is sufficient for normal operation (verification emails + occasional password resets). Upgrade if you run a bulk onboarding campaign.
