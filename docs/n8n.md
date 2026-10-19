# n8n automation

HireFlow uses four production n8n workflows:

- Application API
- Public Read API
- Recruiter Read API
- Recruiter Review API

## Public repository exports

The repository includes sanitized workflow exports for:

- `n8n/application-api.json`
- `n8n/public-read-api.json`
- `n8n/recruiter-read-api.json`

Live credential bindings, private Airtable identifiers, personal notification addresses, and authentication implementation details are removed from the public files.

The remaining production-only review workflow is documented at the architecture level rather than published as an executable export.

Before importing any public export into another n8n instance, reconnect credentials and configure environment-specific resources.
