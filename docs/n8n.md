# n8n automation

HireFlow uses four production n8n workflows:

1. **Application API** — application validation, duplicate detection, Airtable persistence, resume evidence extraction with Gemini, applicant confirmation, and recruiter notification.
2. **Public Read API** — public role and application-status read endpoints.
3. **Recruiter Read API** — authenticated recruiter candidate, detail, and statistics endpoints.
4. **Recruiter Review API** — applies an explicit human recruiter decision, persists the final status, and optionally schedules an interview / sends the corresponding candidate communication.

## Public workflow exports

The repository includes sanitized exports for:

- `n8n/application-api.json`
- `n8n/public-read-api.json`
- `n8n/recruiter-read-api.json`

Before importing them into another n8n instance, reconnect the required credentials and configure the target Airtable resources, webhook authentication, notification addresses, and environment-specific URLs.

## Recruiter review workflow

The recruiter-review workflow is intentionally represented in the architecture documentation rather than as an executable public export. It contains security-sensitive recruiter authentication and employment-decision action wiring. The production workflow only acts on a decision explicitly supplied by a human recruiter; AI does not advance or reject candidates.

## Security

Public exports remove or replace:

- OAuth / API credential bindings
- Airtable base and table IDs
- personal notification email addresses
- authentication verifier implementation
- private environment-specific identifiers
