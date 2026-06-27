# Send a Branded Test Email

## Current state
- `notify.vantage-fsm.com` is **verified** and ready to send.
- The email queue/processing infrastructure already exists (`/lovable/email/queue/process`).
- **Missing:** there are no email templates and no send route yet (`src/lib/email-templates/` is empty), so there is nothing to send a test from.

## What I'll build

### 1. Scaffold app email infrastructure
Generate the send/preview/unsubscribe routes and the template registry (`src/lib/email-templates/registry.ts`). This is the one-time wiring needed before any app email can be sent.

### 2. Branded test template
Create `src/lib/email-templates/test-email.tsx` styled to match Vantage:
- Navy (`#0B1B2A`) / vibrant green (`#00A859`) brand colors, Vantage logo/wordmark in the header.
- Body: a short "This is a test email from Vantage" confirmation message with send timestamp.
- White email background (required), inline styles only.
- Registered in the template registry.

### 3. Trigger the test send
Send one test email through the queue to a recipient address (defaults to your account email — see question below), then confirm it was accepted and logged.

### 4. Verify delivery
- Confirm the send was enqueued and processed (check `email_send_log` for a `sent` status).
- Report back the result so you can check the inbox for branding/deliverability.

## Notes
- DNS is already verified, so emails will actually send (no waiting on propagation).
- This uses Lovable's built-in email infrastructure on your verified domain — no third-party provider.
