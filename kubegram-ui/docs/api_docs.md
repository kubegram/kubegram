# Kubegram API

**Version**: 1.0
**Base URL**: `/api/v1/public`

## Authentication

The API uses **OAuth2** (Access Code Flow).

- **Authorization URL**: `/auth/{provider}/login`
- **Token URL**: `/auth/{provider}/callback`

## Endpoints

### Companies

#### Get all companies
`GET /companies`

- **Description**: Get a list of all companies
- **Responses**:
  - `200`: OK (Returns array of Companies)
  - `500`: Internal Server Error

#### Create a company
`POST /companies`

> **Note**: This is an internal/admin endpoint.
> **IaC**: This endpoint serves as the backing API for the Kubernetes Company CRD and Terraform Provider.

- **Description**: Create a new company resource.
- **Security**: OAuth2 (admin)
- **Body**: Company object (Required)
  - `apiVersion`: "v1" (optional, for CRD parity)
  - `kind`: "Company" (optional)
  - `metadata`: { `name`: "string" }
  - `spec`: { `tokens`: int, `stripeCustomerID`: string }
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Get a company
`GET /companies/{id}`

- **Description**: Get a company by its ID
- **Parameters**:
  - `id` (path, integer): Company ID
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `404`: Not Found


#### Delete a company
`DELETE /companies/{id}`

> **Note**: This is an internal/admin endpoint.
> **IaC**: This endpoint serves as the backing API for the Kubernetes Company CRD and Terraform Provider.

- **Description**: Delete a company resource.
- **Security**: OAuth2 (admin)
- **Parameters**:
  - `id` (path, integer): Company ID
- **Responses**:
  - `204`: No Content
  - `400`: Bad Request
  - `500`: Internal Server Error

---

### Organizations

#### Get all organizations
`GET /organizations`

- **Description**: Get a list of all organizations
- **Responses**:
  - `200`: OK (Returns array of Organizations)
  - `500`: Internal Server Error

#### Create a organization
`POST /organizations`

- **Description**: Create a new organization
- **Body**: Organization object (Required)
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

---

### Infrastructure as Code (IaC) Support

These endpoints accept Kubernetes-style manifests (`apiVersion`, `kind`, `metadata`, `spec`) and are used by CRD controllers and Terraform providers.

#### Create Organization (IaC)
`POST /iac/organizations`

- **Description**: Create a new organization resource using K8s manifest.
- **Body**: Organization Manifest (Required)
  - `apiVersion`: "v1"
  - `kind`: "Organization"
  - `metadata`: { `name`: "string" }
  - `spec`: { `companyID`: int }
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Update Organization (IaC)
`PUT /iac/organizations/{id}`

- **Description**: Update a organization resource using K8s manifest.
- **Parameters**:
  - `id` (path, integer): Organization ID
- **Body**: Organization Manifest (Required)
  - `apiVersion`: "v1"
  - `kind`: "Organization"
  - `metadata`: { `name`: "string" }
  - `spec`: { `companyID`: int }
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Get a organization
`GET /organizations/{id}`

- **Description**: Get a organization by its ID
- **Parameters**:
  - `id` (path, integer): Organization ID
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `404`: Not Found

#### Update a organization
`PUT /organizations/{id}`

- **Description**: Update a organization by ID
- **Parameters**:
  - `id` (path, integer): Organization ID
- **Body**: Organization object (Required)
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Delete a organization
`DELETE /organizations/{id}`

- **Description**: Delete a organization by ID
- **Parameters**:
  - `id` (path, integer): Organization ID
- **Responses**:
  - `204`: No Content
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Delete Organization (IaC)
`DELETE /iac/organizations/{id}`

- **Description**: Delete a organization resource (IaC).
- **Parameters**:
  - `id` (path, integer): Organization ID
- **Responses**:
  - `204`: No Content
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Create Team (IaC)
`POST /iac/teams`

- **Description**: Create a new team resource using K8s manifest.
- **Body**: Team Manifest (Required)
  - `apiVersion`: "v1"
  - `kind`: "Team"
  - `metadata`: { `name`: "string" }
  - `spec`: { `organizationID`: int }
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Update Team (IaC)
`PUT /iac/teams/{id}`

- **Description**: Update a team resource using K8s manifest.
- **Parameters**:
  - `id` (path, integer): Team ID
- **Body**: Team Manifest (Required)
  - `apiVersion`: "v1"
  - `kind`: "Team"
  - `metadata`: { `name`: "string" }
  - `spec`: { `organizationID`: int }
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Delete Team (IaC)
`DELETE /iac/teams/{id}`

- **Description**: Delete a team resource (IaC).
- **Parameters**:
  - `id` (path, integer): Team ID
- **Responses**:
  - `204`: No Content
  - `400`: Bad Request
  - `500`: Internal Server Error

---

### Teams

#### Get all teams
`GET /teams`

- **Description**: Get a list of all teams
- **Responses**:
  - `200`: OK (Returns array of Teams)
  - `500`: Internal Server Error

#### Create a team
`POST /teams`

- **Description**: Create a new team
- **Body**: Team object (Required)
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Get a team
`GET /teams/{id}`

- **Description**: Get a team by its ID
- **Parameters**:
  - `id` (path, integer): Team ID
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `404`: Not Found

#### Update a team
`PUT /teams/{id}`

- **Description**: Update a team by ID
- **Parameters**:
  - `id` (path, integer): Team ID
- **Body**: Team object (Required)
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Delete a team
`DELETE /teams/{id}`

- **Description**: Delete a team by ID
- **Parameters**:
  - `id` (path, integer): Team ID
- **Responses**:
  - `204`: No Content
  - `400`: Bad Request
  - `500`: Internal Server Error

---

### Users

#### Get all users
`GET /users`

- **Description**: Get a list of all registered users
- **Responses**:
  - `200`: OK (Returns array of Users)
  - `500`: Internal Server Error

#### Create a user
`POST /users`

- **Description**: Create a new user account
- **Body**: User object (Required)
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

---

---

### Certificates

#### Upload Public Key
`POST /certificates/upload`

- **Description**: Upload a public key (PEM format) for the authenticated company.
- **Body**: Certificate object (Required)
  - `publicKey`: string (PEM)
  - `label`: string
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Generate Key Pair
`POST /certificates/generate`

- **Description**: Generate a new RSA key pair. The public key is stored, and the private key is returned in the response **only once**.
- **Body**: Generation options
  - `label`: string
- **Responses**:
  - `201`: Created
    - `id`: UUID (Certificate ID)
    - `publicKey`: string (PEM)
    - `privateKey`: string (PEM) - **Save this! It is not stored.**
  - `500`: Internal Server Error

---

### Auth

#### Start OAuth flow
`GET /auth/{provider}/login`

- **Description**: Redirects to the OAuth provider's login page
- **Parameters**:
  - `provider` (path, string): OAuth provider (github, gitlab, google, okta, sso)
- **Responses**:
  - `302`: Redirect to provider
  - `404`: Not Found

#### OAuth callback
`GET /auth/{provider}/callback`

- **Description**: Handles the callback from the OAuth provider, exchanges code for token, and redirects to frontend
- **Parameters**:
  - `provider` (path, string): OAuth provider
  - `code` (query, string): Authorization code
  - `state` (query, string): State parameter
- **Responses**:
  - `302`: Redirect to frontend
  - `400`: Bad Request
  - `401`: Unauthorized
  - `500`: Internal Server Error

#### Refresh OAuth token
`POST /auth/{provider}/refresh`

- **Description**: Refreshes the access token using the stored refresh token
- **Parameters**:
  - `provider` (path, string): OAuth provider
- **Body**: User ID object (Required)
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `401`: Unauthorized
  - `404`: Not Found

---
### Projects

#### Get all projects
`GET /projects`

- **Description**: Get a list of all projects
- **Responses**:
  - `200`: OK (Returns array of Projects)
  - `500`: Internal Server Error

#### Create a project
`POST /projects`

- **Description**: Create a new project
- **Body**: Project object (Required)
- **Responses**:
  - `201`: Created
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Get a project
`GET /projects/{id}`

- **Description**: Get a project by its ID
- **Parameters**:
  - `id` (path, integer): Project ID
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `404`: Not Found

#### Update a project
`PUT /projects/{id}`

- **Description**: Update a project by ID
- **Parameters**:
  - `id` (path, integer): Project ID
- **Body**: Project object (Required)
- **Responses**:
  - `200`: OK
  - `400`: Bad Request
  - `500`: Internal Server Error

#### Delete a project
`DELETE /projects/{id}`

- **Description**: Delete a project by ID
- **Parameters**:
  - `id` (path, integer): Project ID
- **Responses**:
  - `204`: No Content
  - `400`: Bad Request
  - `500`: Internal Server Error

---

### Health

#### Liveness probe
`GET /healthz/live`

- **Description**: Returns 200 when the application is running
- **Responses**:
  - `200`: OK

#### Readiness probe
`GET /healthz/ready`

- **Description**: Returns 200 when the application can connect to PostgreSQL
- **Responses**:
  - `200`: OK
  - `503`: Service Unavailable
