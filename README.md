# HireFlow AI

HireFlow AI is a human-in-the-loop recruitment automation platform that streamlines candidate intake, resume evidence extraction, recruiter review, and candidate communication.

## What it does

- Accepts candidate applications and PDF resumes
- Stores resumes privately and extracts text before workflow processing
- Validates applications and detects duplicates
- Uses Google Gemini to extract structured, role-specific evidence
- Stores candidate and review data in Airtable
- Sends applicant and recruiter notifications through Gmail
- Provides an OAuth-protected recruiter workspace
- Keeps final hiring decisions with a human recruiter

## Architecture

```text
Applicant
   ↓
Floot web app
   ↓
Private PDF storage
   ↓
PDF → text extraction
   ↓
n8n application workflow
   ↓
Validation + duplicate detection
   ↓
Airtable candidate record
   ↓
Gemini REST API
   ↓
Structured evidence validation
   ↓
Airtable review packet
   ↓
Recruiter review + Gmail notifications
```

## Tech Stack

- TypeScript / React
- Floot
- n8n
- Google Gemini API
- Airtable
- Gmail API / OAuth 2.0
- REST APIs
- Render

## Production engineering

The first implementation processed PDF binary/Base64 data inside n8n and used n8n's LangChain/Gemini nodes. On a 512 MB Render instance this caused out-of-memory failures.

The production architecture was redesigned to extract PDF text upstream in Floot and send only a small JSON payload to n8n. The LLM inference step was also changed to a lightweight Gemini REST request with structured JSON validation. This removed the main memory bottlenecks while preserving the human-review workflow.

## Repository layout

```text
frontend/   Floot application source snapshot
n8n/        Sanitized n8n workflow exports
docs/       Architecture and workflow documentation
```

## Security

Secrets are intentionally excluded from this repository. Use environment variables / platform credentials for API keys, OAuth secrets, database credentials, and webhook authentication. The `n8n/` directory contains sanitized public exports of the application, public-read, and recruiter-read workflows. Credential bindings, private resource IDs, personal notification addresses, and recruiter-auth verification internals are removed. The human recruiter review workflow is documented under `docs/` rather than published as an executable export.

## Live application

https://hireflow-ai.floot.app

## License

This project is shared for portfolio and educational purposes.
