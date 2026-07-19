# Backend Security Notes

## Endpoint Protection

The backend applies these protections globally:

- CORS is restricted to `FRONTEND_URL`, localhost development origins, and values in `ALLOWED_ORIGINS`.
- API responses are sanitized before leaving the server so sensitive fields such as `scriptUrl`, `folderId`, tokens, passwords, and credentials are hidden.
- Server errors return a generic message to clients. Detailed errors stay in backend logs.
- API routes use rate limiting to reduce spam and accidental repeated actions.
- API and generated PDF responses use `Cache-Control: no-store`.
- Generated local PDFs are protected by the same API key middleware when `API_KEY` is configured.
- Upload size is limited for Excel, logo, and chat media uploads.
- Security headers are applied to all responses.

## Recommended Environment Variables

```env
FRONTEND_URL=http://192.168.1.254:5173
ALLOWED_ORIGINS=http://192.168.1.254:5173,http://192.168.1.254:8098,http://localhost:5173,http://localhost:8098
BODY_LIMIT=2mb
EXCEL_UPLOAD_LIMIT=15728640
CHAT_MEDIA_UPLOAD_LIMIT=67108864
```

Optional for stricter local/API integrations:

```env
API_KEY=change-this-long-random-value
```

When `API_KEY` is set, all API requests and Socket.IO connections must include the same key. For the Vite frontend, set this before building or running dev:

```env
VITE_API_KEY=change-this-long-random-value
```

Without `API_KEY`, the backend is still protected by CORS, response sanitization, rate limiting, and cache controls, but it is not fully authenticated.

## Secret Handling

Do not commit runtime config files that contain live URLs, tokens, sessions, or credentials. The Google Drive PDF config is ignored by Git:

```text
backend/data/pdf-drive-config.json
```

If an Apps Script URL or Google Drive folder ID has already appeared in an endpoint response, rotate or redeploy the Apps Script URL and update the config from the UI.
