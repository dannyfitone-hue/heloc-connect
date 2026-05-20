# HELOC Live MVP System

This is the actual starter system to launch:
- Premium landing page
- Intake form
- Supabase database
- Private client magic-link status portal
- Owner master portal
- Lender portal
- Document request system
- Client document upload
- Status syncing
- Commission calculation

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL editor.
3. Create Supabase Storage bucket: `client-documents`.
4. Copy `.env.example` to `.env.local`.
5. Add Supabase keys.
6. Run:

```bash
npm install
npm run dev
```

## Pages

- `/` Landing page
- `/thank-you/[token]` confirmation page
- `/status/[token]` client dashboard
- `/owner` owner dashboard
- `/lender` lender portal

## Client Statuses

1. Application Received
2. Application Being Processed
3. Matching The Right Lender
4. Lender Matched
5. Lender Will Contact You Shortly
6. Documents Requested
7. Funded
8. Rejected
