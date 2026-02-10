## Database

## Kubegram Server

### Company

| Field      | Type      |
| ------------- | ------------- |
| ID| UUID |
| CreatedAt | Datetime |
| UpdatedAt | Datetime |
| DeletedAt | Datetime |
| name | str |
| stripeCustomerID | str(index) |
| tokens | str array |

### Organization

| Field      | Type      |
| ------------- | ------------- |
| ID| UUID |
| CreatedAt | Datetime |
| UpdatedAt | Datetime |
| DeletedAt | Datetime |
| name | str |
| companyID | fk(company) |


### Team

| Field      | Type      |
| ------------- | ------------- |
| ID| UUID |
| CreatedAt | Datetime |
| UpdatedAt | Datetime |
| DeletedAt | Datetime |
| name | str |
| organizationID | fk(organization) |

### User

| Field      | Type      |
| ------------- | ------------- |
| ID| UUID |
| CreatedAt | Datetime |
| UpdatedAt | Datetime |
| DeletedAt | Datetime |
| name | str |
| name | str |
| email | str |
| provider | str |
| avatarURL | str |
| role | str |
| teamID | fk(team) |
| config | JSON string |


### Project

| Field      | Type      |
| ------------- | ------------- |
| ID| UUID |
| CreatedAt | Datetime |
| UpdatedAt | Datetime |
| DeletedAt | Datetime |
| graphId | UUID index |
| graphMeta | JSON str |

### OAuth Provider

| Field      | Type      |
| ------------- | ------------- |
| ID| UUID |
| companyID | fk(companies) (optional) |
| CreatedAt | Datetime |
| UpdatedAt | Datetime |
| DeletedAt | Datetime |
| name | str |
| clientId | str |
| encryptedClientSecretUrl | str (S3/Storage URL) |
| encryptionKeyID | fk(company_certificates) |
| redirectUri | str |
| authUrl | str |
| tokenUrl | str |
| scope | str array |

### RBAC

#### Roles

| Field | Type |
| --- | --- |
| ID | UUID |
| companyID | fk(companies) |
| name | str |
| description | str |
| createdAt | Datetime |
| updatedAt | Datetime |

> **Note**: Roles are defined per Company. System roles can have null companyID.

#### Permissions

| Field | Type |
| --- | --- |
| ID | UUID |
| name | str (unique) |
| description | str |
| resource | str |
| action | str |
| scopes | str array ['company', 'org', 'team'] |
| createdAt | Datetime |
| updatedAt | Datetime |

> **Detail**: `scopes` defines where this permission is applicable. e.g. `['org', 'team']`.

### Standard Permission Sets

#### Organization Level
Permissions applicable when assigned a role at the Organization scope:
- `org:read`, `org:update`, `org:delete`
- `org:billing:read`, `org:billing:update`
- `team:create`, `team:delete` (globally in org)
- `member:invite`, `member:remove` (from org)

#### Team Level
Permissions applicable when assigned a role at the Team scope:
- `team:read`, `team:update`
- `project:create`, `project:read`, `project:update`, `project:delete`
- `member:add`, `member:remove` (from team)


#### RolePermissions

| Field | Type |
| --- | --- |
| roleID | fk(roles) |
| permissionID | fk(permissions) |
| createdAt | Datetime |

#### UserRoles

| Field | Type |
| --- | --- |
| userID | fk(users) |
| roleID | fk(roles) |
| companyID | fk(companies) |
| organizationID | fk(organizations) |
| teamID | fk(teams) |
| createdAt | Datetime |

> **Note**: Assignments must specify one scope level (Company, Org, or Team).

### LLM Security

#### CompanyCertificates

Stores public keys (certificates) for users. Used for encrypting secrets that only specific users can decrypt.

| Field | Type |
| --- | --- |
| ID | UUID |
| companyID | fk(companies) |
| publicKeyUrl | str (S3/Storage URL) |
| fingerprint | str (SHA256) |
| label | str (e.g. "MacBook Pro") |
| createdAt | Datetime |
| invalidatedAt | Datetime |

#### CompanyLLMTokens

Stores encrypted LLM provider tokens.

| Field | Type |
| --- | --- |
| ID | UUID |
| companyID | fk(companies) |
| provider | str (e.g. 'openai') |
| encryptedTokenUrl | str (S3/Storage URL) |
| encryptionKeyID | fk(company_certificates) or str |
| createdAt | Datetime |
| updatedAt | Datetime |
