# Security and privacy

87K Windows is an early hackathon prototype. Do not use it with real personal information, real participant photographs or contact details.

## Supported use

- Use only the clearly fictional fixtures supplied in this repository.
- Keep all model credentials in server environment variables.
- Never prefix a secret with `VITE_`; that would expose it to browser code.
- Uploaded images are processed in memory and are not intentionally written to disk.
- Room state is ephemeral and expires automatically.
- The interface asks for approval before a safe capsule can enter matching.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not open a public issue containing an exploit, credential, personal data or raw submission.

No production security support or data-retention guarantee is offered at this prototype stage.
