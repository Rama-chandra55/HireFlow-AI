# n8n automation

HireFlow uses four production n8n workflows: application intake/AI processing, public read APIs, recruiter read APIs, and recruiter review APIs.

The live workflow exports are intentionally not committed because they contain environment-specific webhook and credential bindings. The repository documents the architecture while secrets and credential mappings remain in n8n's credential store.
