# HireFlow AI Architecture

## Production flow

```text
Applicant → Floot → private PDF storage → PDF text extraction → n8n → validation / duplicate detection → Airtable → Gemini REST API → structured evidence validation → recruiter review → Gmail notifications
```

## Production optimization

The first implementation sent PDF/Base64 data into n8n and used LangChain/Gemini nodes. On a 512 MB Render instance this caused out-of-memory failures. The production version performs PDF text extraction upstream in Floot and sends only a small JSON payload to n8n. Because HireFlow needs one structured inference step rather than agent orchestration, the production workflow calls Gemini directly over HTTP and validates the returned JSON before saving it.

## Human-in-the-loop

Gemini organizes evidence against a role rubric. It does not rank candidates or make hiring decisions. Final advancement or rejection remains a recruiter action.
