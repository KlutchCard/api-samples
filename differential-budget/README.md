# Copilot Instructions for Klutch API Samples

## Overview
This repository contains sample code for interacting with the Klutch API, focusing on the `differential-budget` example. The code demonstrates authentication and GraphQL usage with Klutch's endpoints.

## Architecture & Key Files
- `differential-budget/differential-budget.js`: Main entry point. Handles authentication and GraphQL requests to the Klutch API.
- `differential-budget/package.json`: Declares dependencies (e.g., `node-fetch`) and entry script.
- Environment variables (`KLUTCH_ENDPOINT`, `KLUTCH_CLIENT_ID`, `KLUTCH_SECRET_KEY`) are required for API access.

## Developer Workflows
- **Run the sample:**
  1. Install dependencies: `npm install` (if not already present)
  2. Set required environment variables (see below)
  3. Run: `npm start` from the `differential-budget` directory

## Environment Variables
- `KLUTCH_ENDPOINT`: Klutch GraphQL endpoint (e.g., `https://graphql.klutchcard.com/graphql`)
- `KLUTCH_CLIENT_ID`: API client ID
- `KLUTCH_SECRET_KEY`: API secret key

## Patterns & Conventions
- GraphQL queries are sent via POST with JSON bodies
- Authentication is performed by a `createSessionToken` mutation
- Errors from the API are thrown as exceptions with details
- All configuration is via environment variables (no config files)

## Integration Points
- Communicates with the Klutch API via GraphQL
- Expects valid credentials and endpoint to be provided at runtime

## Example Usage
```sh
# In differential-budget directory
npm install
KLUTCH_ENDPOINT="https://graphql.klutchcard.com/graphql"
KLUTCH_CLIENT_ID="your-client-id"
KLUTCH_SECRET_KEY="your-secret-key"
npm start
```


