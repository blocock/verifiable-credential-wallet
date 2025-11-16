# Verifiable Credential Wallet

A simple Verifiable Credential Wallet application that allows users to issue, view, share, and verify digital credentials.

## Features

### Backend (NestJS)
- **Issue Credentials**: Create and sign new verifiable credentials
- **List Credentials**: View all credentials in the wallet
- **Get Credential**: Fetch a specific credential by ID
- **Verify Credential**: Verify the signature and integrity of a credential
- **Delete Credential**: Remove credentials from the wallet

### Frontend
- **Dashboard**: View all issued credentials
- **Issue Form**: Create new credentials with custom types and claims
- **Credential Details**: View full credential information
- **Share Credential**: Copy JSON or generate shareable links
- **Verify Credential**: Paste JSON to verify validity

## Technology Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Cryptography**: Node.js crypto module (RSA-2048 key pairs with RSA-SHA256 signing)
- **Key Management**: Automatic key generation and file-based persistence
- **Containerization**: Docker

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (optional, for containerized deployment)

### Running with Docker (Recommended)

1. Build and start the backend:
```bash
docker compose up -d
```

The backend will be available at `http://localhost:3000`

2. Open the frontend:
Simply open `frontend/index.html` in your web browser, or serve it with a simple HTTP server:

```bash
cd frontend
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` in your browser.

### Running Locally (Development)

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Start the backend:
```bash
npm run start:dev
```

3. Serve the frontend (as described above)

## API Endpoints

### POST /credentials/issue
Issue a new credential.

**Request Body:**
```json
{
  "type": "Gym Membership Card",
  "claims": {
    "name": "John Doe",
    "membershipId": "12345",
    "expiryDate": "2025-12-31"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "type": "Gym Membership Card",
  "claims": {...},
  "issuer": "self",
  "issuedAt": "2024-01-01T00:00:00.000Z",
  "proof": {...}
}
```

### GET /credentials
List all credentials in the wallet.

### GET /credentials/:id
Get a specific credential by ID.

### POST /credentials/verify
Verify a credential.

**Request Body:**
```json
{
  "credential": {
    "id": "...",
    "type": "...",
    "claims": {...},
    "issuer": "...",
    "issuedAt": "...",
    ...
  }
}
```

**Response:**
```json
{
  "valid": true,
  "error": "optional error message"
}
```

### DELETE /credentials/:id
Delete a credential by ID.

## Project Structure

```
verifiable-credential-wallet/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   |   └── utils/
│   │   |       └── json-canonicalizer.util.ts
│   │   ├── credentials/
│   │   │   ├── dto/
│   │   │   ├── interfaces/
│   │   │   ├── credentials.controller.ts
│   │   │   ├── credentials.service.ts
│   │   │   └── credentials.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── docker-compose.yml
└── README.md
```

## Key Management

The application uses proper RSA key management:

- **Key Generation**: RSA-2048 key pairs are automatically generated on first startup
- **Key Persistence**: Keys are stored in the `./keys` directory (configurable via `KEY_DIR` environment variable)
- **Key Security**: 
  - Private keys are stored with restricted permissions (600)
  - Public keys are stored with standard permissions (644)
  - Keys are never committed to version control (excluded in `.gitignore`)
- **Signing Algorithm**: RSA-SHA256 for credential signing and verification

