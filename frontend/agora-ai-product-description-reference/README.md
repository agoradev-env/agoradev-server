# Agora AI Product Description Generator — Prototype Reference

## Purpose
This folder contains the standalone AI Product Description Generator and Monitoring prototype for the Agora development team.

It is provided inside Agora's frontend repository so the team can review and reuse the relevant components and functionality.

**Integration status:** This is a standalone Express-based prototype with a static HTML, CSS, and JavaScript frontend. It has not yet been integrated into Agora's Next.js application. The development team should adapt the required server-side functionality to Agora's architecture.

## Folder Structure
- `frontend/` — Product description generator interface.
- `backend/` — Express server and dashboard-admin setup script.
- `monitoring/` — Monitoring dashboard and activity pages.
- `package.json` and `package-lock.json` — Prototype dependencies.
- `.env.example` — Example environment configuration.

## Local Setup
1. Open a terminal in this folder.
2. Install dependencies using `npm install`.
3. Create a `.env` file based on `.env.example`.
4. Configure the required environment variables with approved credentials.
5. Start the prototype using `node backend/server.js`.
6. Open `http://localhost:3000` in your browser.

## Security
- Never commit `.env` or actual credentials.
- Keep API calls and secret-dependent operations on the server.
- `.env.example` contains placeholders only.
- Email delivery using the Agora-owned Gmail account is still pending approved SMTP authentication.

## Integration Considerations
1. Review the product-generation and monitoring logic.
2. Identify the frontend components and interactions to reuse.
3. Adapt server-side functionality to Agora's Next.js architecture.
4. Review authentication, authorization, environment variables, and API security.
5. Configure and test email notifications with approved Agora credentials.
6. Test the integrated feature before deployment.

## Handover Scope
This is a reference implementation, not a production integration. It does not replace or modify Agora's existing NestJS backend.
