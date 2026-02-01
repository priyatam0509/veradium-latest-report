# Complete Postman API Testing Documentation
## RBAC System - All 14 Endpoints

---

## 📋 Table of Contents

1. [Setup](#setup)
2. [Authentication Endpoints (3)](#authentication-endpoints)
3. [User Management Endpoints (4)](#user-management-endpoints)
4. [Role Management Endpoints (3)](#role-management-endpoints)
5. [Route Management Endpoints (4)](#route-management-endpoints)
6. [Testing Sequences](#testing-sequences)
7. [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites

✅ CloudFormation stack deployed
✅ Initial data inserted (roles, your admin user, routes)
✅ API URL from CloudFormation outputs

### Get Your API URL

```bash
aws cloudformation describe-stacks \
  --stack-name RoleBaseControl \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

Example: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev`

### Postman Environment Setup

1. Click **Environments** (left sidebar)
2. Click **+** to create new environment
3. Name it: `RBAC Dev`
4. Add variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `https://YOUR_API_URL/dev` | `https://YOUR_API_URL/dev` |
| `admin_email` | `piyush@itrenaissancellc720.onmicrosoft.com` | `piyush@itrenaissancellc720.onmicrosoft.com` |

5. Click **Save**
6. Select **RBAC Dev** from environment dropdown (top right)

---

## Authentication Endpoints

### 1. POST /auth/verify ✅
**Verify user exists and return their role**

**URL:** `{{base_url}}/auth/verify`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "{{admin_email}}"
}
```

**Success Response (200):**
```json
{
  "user": {
    "email": "piyush@itrenaissancellc720.onmicrosoft.com",
    "userId": "user-12345678",
    "role": "ADMIN",
    "displayName": "Admin User",
    "isEnabled": true
  }
}
```

**Error Responses:**

**403 - User Not Authorized:**
```json
{
  "error": "User not authorized",
  "message": "You have successfully logged in, but your account is not authorized to access this application."
}
```

**403 - Account Disabled:**
```json
{
  "error": "User account disabled",
  "message": "Your account has been disabled. Please contact administrator."
}
```

---

### 2. POST /auth/check-permission ✅
**Check if user can access a specific route**

**URL:** `{{base_url}}/auth/check-permission`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "{{admin_email}}",
  "route": "/dashboard"
}
```

**Test Cases:**

**Test 1 - ADMIN accessing /dashboard (should be allowed):**
```json
{
  "email": "piyush@itrenaissancellc720.onmicrosoft.com",
  "route": "/dashboard"
}
```

**Response:**
```json
{
  "allowed": true
}
```

**Test 2 - ANALYST accessing /admin/users (should be denied):**
```json
{
  "email": "analyst@company.com",
  "route": "/admin/users"
}
```

**Response:**
```json
{
  "allowed": false
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "error": "Email and route are required"
}
```

**404 - Route Not Found:**
```json
{
  "allowed": false,
  "error": "Route not found"
}
```

---

### 3. POST /auth/accessible-routes ✅
**Get all routes the user can access based on their role**

**URL:** `{{base_url}}/auth/accessible-routes`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "{{admin_email}}"
}
```

**Success Response (200):**
```json
{
  "role": "ADMIN",
  "routes": [
    {
      "route": "/dashboard",
      "routeId": "route-abc12345",
      "label": "Dashboard",
      "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
      "isEnabled": true,
      "description": "Main dashboard view",
      "createdAt": "2025-01-17T10:00:00Z",
      "updatedAt": "2025-01-17T10:00:00Z"
    },
    {
      "route": "/admin/users",
      "routeId": "route-xyz67890",
      "label": "User Management",
      "allowedRoles": ["ADMIN"],
      "isEnabled": true,
      "description": "Manage system users",
      "createdAt": "2025-01-17T10:00:00Z",
      "updatedAt": "2025-01-17T10:00:00Z"
    },
    {
      "route": "/metrics/real-time",
      "routeId": "route-def34567",
      "label": "Real-Time Metrics",
      "allowedRoles": ["ADMIN", "SUPERVISOR"],
      "isEnabled": true,
      "description": "Live operational metrics",
      "createdAt": "2025-01-17T10:00:00Z",
      "updatedAt": "2025-01-17T10:00:00Z"
    },
    {
      "route": "/reports/historical",
      "routeId": "route-ghi78901",
      "label": "Historical Reports",
      "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
      "isEnabled": true,
      "description": "Access historical data",
      "createdAt": "2025-01-17T10:00:00Z",
      "updatedAt": "2025-01-17T10:00:00Z"
    }
  ]
}
```

**Error Response:**

**400 - Missing Email:**
```json
{
  "error": "Email is required"
}
```

**403 - User Not Found:**
```json
{
  "error": "User not found"
}
```

---

## User Management Endpoints

### 4. POST /users/list ✅ (ADMIN Only)
**Get all users in the system**

**URL:** `{{base_url}}/users/list`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "{{admin_email}}"
}
```

**Success Response (200):**
```json
[
  {
    "email": "piyush@itrenaissancellc720.onmicrosoft.com",
    "userId": "user-12345678",
    "role": "ADMIN",
    "displayName": "Admin User",
    "isEnabled": true,
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z",
    "lastLogin": "2025-01-17T18:05:23Z"
  },
  {
    "email": "jane.smith@company.com",
    "userId": "user-87654321",
    "role": "SUPERVISOR",
    "displayName": "Jane Smith",
    "isEnabled": true,
    "createdAt": "2025-01-17T18:10:00Z",
    "updatedAt": "2025-01-17T18:10:00Z",
    "lastLogin": ""
  }
]
```

**Error Responses:**

**400 - Missing Email:**
```json
{
  "error": "Email is required"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

### 5. POST /users ✅ (ADMIN Only)
**Create a new user**

**URL:** `{{base_url}}/users`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}",
  "email": "jane.smith@company.com",
  "role": "SUPERVISOR",
  "displayName": "Jane Smith"
}
```

**Available Roles:**
- `ADMIN` - Full system access
- `SUPERVISOR` - Team oversight and reporting
- `ANALYST` - Read-only access

**Test Cases:**

**Test 1 - Create SUPERVISOR:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "email": "jane.smith@company.com",
  "role": "SUPERVISOR",
  "displayName": "Jane Smith"
}
```

**Test 2 - Create ANALYST:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "email": "john.doe@company.com",
  "role": "ANALYST",
  "displayName": "John Doe"
}
```

**Test 3 - Create another ADMIN:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "email": "admin2@company.com",
  "role": "ADMIN",
  "displayName": "Secondary Admin"
}
```

**Success Response (200):**
```json
{
  "email": "jane.smith@company.com",
  "userId": "user-87654321",
  "role": "SUPERVISOR",
  "displayName": "Jane Smith",
  "isEnabled": true,
  "createdAt": "2025-01-17T18:30:00Z",
  "updatedAt": "2025-01-17T18:30:00Z"
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "error": "Missing required fields"
}
```

**400 - User Already Exists:**
```json
{
  "error": "User already exists"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

### 6. PATCH /users/{email} ✅ (ADMIN Only)
**Update a user's role or status**

**URL:** `{{base_url}}/users/jane.smith@company.com`

**Note:** Email in URL should be URL-encoded. Postman does this automatically.

**Method:** `PATCH`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}",
  "role": "ANALYST",
  "isEnabled": true
}
```

**Test Cases:**

**Test 1 - Change Role:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "role": "ANALYST"
}
```

**Test 2 - Disable User:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "isEnabled": false
}
```

**Test 3 - Change Role and Enable:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "role": "SUPERVISOR",
  "isEnabled": true
}
```

**Test 4 - Change Display Name:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "displayName": "Jane Smith - Senior Supervisor"
}
```

**Success Response (200):**
```json
{
  "email": "jane.smith@company.com",
  "userId": "user-87654321",
  "role": "ANALYST",
  "displayName": "Jane Smith",
  "isEnabled": true,
  "createdAt": "2025-01-17T18:30:00Z",
  "updatedAt": "2025-01-17T18:45:00Z",
  "lastLogin": ""
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "error": "Missing required fields"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

**404 - User Not Found:**
```json
{
  "error": "User not found"
}
```

---

### 7. DELETE /users/{email} ✅ (ADMIN Only)
**Delete a user from the system**

**URL:** `{{base_url}}/users/jane.smith@company.com`

**Method:** `DELETE`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}"
}
```

**Test Cases:**

**Test 1 - Delete Regular User:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com"
}
```
URL: `{{base_url}}/users/jane.smith@company.com`

**Test 2 - Try to Delete Default Admin (should fail):**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com"
}
```
URL: `{{base_url}}/users/piyush@itrenaissancellc720.onmicrosoft.com`

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**

**403 - Cannot Delete Default Admin:**
```json
{
  "error": "Cannot delete default admin user"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

## Role Management Endpoints

### 8. POST /roles/list ✅
**Get all roles in the system**

**URL:** `{{base_url}}/roles/list`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{}
```

**Note:** This endpoint doesn't require authentication - anyone can view roles.

**Success Response (200):**
```json
[
  {
    "roleId": "ADMIN",
    "description": "Full system access including user and permission management",
    "color": "bg-red-500/10 text-red-500 border-red-500/20",
    "isSystem": true,
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z"
  },
  {
    "roleId": "SUPERVISOR",
    "description": "Access to reporting, analytics, and team oversight",
    "color": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "isSystem": true,
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z"
  },
  {
    "roleId": "ANALYST",
    "description": "Read-only access to metrics and historical reports",
    "color": "bg-green-500/10 text-green-500 border-green-500/20",
    "isSystem": true,
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z"
  }
]
```

---

### 9. POST /roles ✅ (ADMIN Only)
**Create a new custom role**

**URL:** `{{base_url}}/roles`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}",
  "roleId": "MANAGER",
  "description": "Team management and reporting access",
  "color": "bg-purple-500/10 text-purple-500 border-purple-500/20"
}
```

**Test Cases:**

**Test 1 - Create MANAGER Role:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "roleId": "MANAGER",
  "description": "Team management and reporting access",
  "color": "bg-purple-500/10 text-purple-500 border-purple-500/20"
}
```

**Test 2 - Create VIEWER Role:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "roleId": "VIEWER",
  "description": "View-only access to dashboards",
  "color": "bg-gray-500/10 text-gray-500 border-gray-500/20"
}
```

**Test 3 - Create SUPPORT Role:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "roleId": "SUPPORT",
  "description": "Customer support access",
  "color": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
}
```

**Success Response (200):**
```json
{
  "roleId": "MANAGER",
  "description": "Team management and reporting access",
  "color": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "isSystem": false,
  "createdAt": "2025-01-17T19:00:00Z",
  "updatedAt": "2025-01-17T19:00:00Z"
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "error": "Missing required fields"
}
```

**400 - Role Already Exists:**
```json
{
  "error": "Role already exists"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

### 10. DELETE /roles/{roleId} ✅ (ADMIN Only)
**Delete a custom role**

**URL:** `{{base_url}}/roles/MANAGER`

**Note:** Cannot delete system roles (ADMIN, SUPERVISOR, ANALYST)

**Method:** `DELETE`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}"
}
```

**Test Cases:**

**Test 1 - Delete Custom Role (MANAGER):**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com"
}
```
URL: `{{base_url}}/roles/MANAGER`

**Test 2 - Try to Delete System Role (should fail):**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com"
}
```
URL: `{{base_url}}/roles/ADMIN`

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**

**403 - Cannot Delete System Role:**
```json
{
  "error": "Cannot delete system role"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

## Route Management Endpoints

### 11. POST /routes/list ✅
**Get all routes in the system**

**URL:** `{{base_url}}/routes/list`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{}
```

**Note:** This endpoint doesn't require authentication - anyone can view routes.

**Success Response (200):**
```json
[
  {
    "route": "/dashboard",
    "routeId": "route-abc12345",
    "label": "Dashboard",
    "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
    "isEnabled": true,
    "description": "Main dashboard view",
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z"
  },
  {
    "route": "/admin/users",
    "routeId": "route-xyz67890",
    "label": "User Management",
    "allowedRoles": ["ADMIN"],
    "isEnabled": true,
    "description": "Manage system users",
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z"
  },
  {
    "route": "/metrics/real-time",
    "routeId": "route-def34567",
    "label": "Real-Time Metrics",
    "allowedRoles": ["ADMIN", "SUPERVISOR"],
    "isEnabled": true,
    "description": "Live operational metrics",
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z"
  },
  {
    "route": "/reports/historical",
    "routeId": "route-ghi78901",
    "label": "Historical Reports",
    "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
    "isEnabled": true,
    "description": "Access historical data",
    "createdAt": "2025-01-17T18:00:00Z",
    "updatedAt": "2025-01-17T18:00:00Z"
  }
]
```

---

### 12. POST /routes ✅ (ADMIN Only)
**Create a new route**

**URL:** `{{base_url}}/routes`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}",
  "route": "/reports/custom",
  "label": "Custom Reports",
  "allowedRoles": ["ADMIN", "SUPERVISOR"],
  "description": "Create and view custom reports"
}
```

**Test Cases:**

**Test 1 - Create Custom Reports Route:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "route": "/reports/custom",
  "label": "Custom Reports",
  "allowedRoles": ["ADMIN", "SUPERVISOR"],
  "description": "Create and view custom reports"
}
```

**Test 2 - Create Settings Route (ADMIN only):**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "route": "/admin/settings",
  "label": "System Settings",
  "allowedRoles": ["ADMIN"],
  "description": "Configure system settings"
}
```

**Test 3 - Create Profile Route (All roles):**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "route": "/profile",
  "label": "User Profile",
  "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
  "description": "View and edit user profile"
}
```

**Test 4 - Create Team Route (ADMIN + SUPERVISOR):**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "route": "/team/management",
  "label": "Team Management",
  "allowedRoles": ["ADMIN", "SUPERVISOR"],
  "description": "Manage team members and assignments"
}
```

**Success Response (200):**
```json
{
  "route": "/reports/custom",
  "routeId": "route-jkl23456",
  "label": "Custom Reports",
  "allowedRoles": ["ADMIN", "SUPERVISOR"],
  "isEnabled": true,
  "description": "Create and view custom reports",
  "createdAt": "2025-01-17T19:15:00Z",
  "updatedAt": "2025-01-17T19:15:00Z"
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "error": "Missing required fields"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

### 13. PATCH /routes/{id} ✅ (ADMIN Only)
**Update a route's permissions or status**

**URL:** `{{base_url}}/routes/route-jkl23456`

**Note:** Replace `route-jkl23456` with actual routeId from GET /routes/list response

**Method:** `PATCH`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}",
  "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
  "isEnabled": true
}
```

**Test Cases:**

**Test 1 - Add ANALYST to Allowed Roles:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"]
}
```

**Test 2 - Disable Route:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "isEnabled": false
}
```

**Test 3 - Update Label and Description:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "label": "Advanced Custom Reports",
  "description": "Create, view, and export custom reports with advanced filtering"
}
```

**Test 4 - Restrict to ADMIN Only:**
```json
{
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "allowedRoles": ["ADMIN"],
  "isEnabled": true
}
```

**Success Response (200):**
```json
{
  "route": "/reports/custom",
  "routeId": "route-jkl23456",
  "label": "Custom Reports",
  "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
  "isEnabled": true,
  "description": "Create and view custom reports",
  "createdAt": "2025-01-17T19:15:00Z",
  "updatedAt": "2025-01-17T19:30:00Z"
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "error": "Missing required fields"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

### 14. DELETE /routes/{id} ✅ (ADMIN Only)
**Delete a route**

**URL:** `{{base_url}}/routes/route-jkl23456`

**Note:** Replace `route-jkl23456` with actual routeId

**Method:** `DELETE`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "requesterEmail": "{{admin_email}}"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "error": "Missing required fields"
}
```

**403 - Not Admin:**
```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

---

## Testing Sequences

### Sequence 1: Complete User Lifecycle

**Step 1:** Verify your admin account
```
POST /auth/verify
Body: {"email": "piyush@itrenaissancellc720.onmicrosoft.com"}
```

**Step 2:** Create a new SUPERVISOR user
```
POST /users
Body: {
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "email": "jane.smith@company.com",
  "role": "SUPERVISOR",
  "displayName": "Jane Smith"
}
```

**Step 3:** List all users (verify Jane was created)
```
POST /users/list
Body: {"email": "piyush@itrenaissancellc720.onmicrosoft.com"}
```

**Step 4:** Get Jane's accessible routes
```
POST /auth/accessible-routes
Body: {"email": "jane.smith@company.com"}
```

**Step 5:** Update Jane to ANALYST role
```
PATCH /users/jane.smith@company.com
Body: {
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "role": "ANALYST"
}
```

**Step 6:** Verify Jane's routes changed
```
POST /auth/accessible-routes
Body: {"email": "jane.smith@company.com"}
```

**Step 7:** Delete Jane
```
DELETE /users/jane.smith@company.com
Body: {"requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com"}
```

---

### Sequence 2: Role and Route Management

**Step 1:** List all roles
```
POST /roles/list
Body: {}
```

**Step 2:** Create MANAGER role
```
POST /roles
Body: {
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "roleId": "MANAGER",
  "description": "Team management access",
  "color": "bg-purple-500/10 text-purple-500"
}
```

**Step 3:** List all routes
```
POST /routes/list
Body: {}
```

**Step 4:** Create a new route for MANAGER
```
POST /routes
Body: {
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "route": "/team/performance",
  "label": "Team Performance",
  "allowedRoles": ["ADMIN", "MANAGER"],
  "description": "View team performance metrics"
}
```

**Step 5:** Create a MANAGER user
```
POST /users
Body: {
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "email": "manager@company.com",
  "role": "MANAGER",
  "displayName": "Team Manager"
}
```

**Step 6:** Check MANAGER's accessible routes
```
POST /auth/accessible-routes
Body: {"email": "manager@company.com"}
```

**Step 7:** Update route to include SUPERVISOR
```
PATCH /routes/{routeId}
Body: {
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "allowedRoles": ["ADMIN", "MANAGER", "SUPERVISOR"]
}
```

---

### Sequence 3: Permission Checking

**Step 1:** Create test users with different roles
```
POST /users
Body: {
  "requesterEmail": "piyush@itrenaissancellc720.onmicrosoft.com",
  "email": "analyst@company.com",
  "role": "ANALYST",
  "displayName": "Test Analyst"
}
```

**Step 2:** Check ANALYST access to /dashboard (should be allowed)
```
POST /auth/check-permission
Body: {
  "email": "analyst@company.com",
  "route": "/dashboard"
}
```

**Step 3:** Check ANALYST access to /admin/users (should be denied)
```
POST /auth/check-permission
Body: {
  "email": "analyst@company.com",
  "route": "/admin/users"
}
```

**Step 4:** Get all accessible routes for ANALYST
```
POST /auth/accessible-routes
Body: {"email": "analyst@company.com"}
```

---

## Troubleshooting

### Common Issues

**Issue 1: "Unauthorized" (401)**
**Solution:** Stack needs to be updated with `AuthorizationType: NONE` on all routes
```bash
aws cloudformation update-stack --stack-name RoleBaseControl --template-body file://rbac-api-exact-design.yaml --capabilities CAPABILITY_NAMED_IAM
```

**Issue 2: "User not found" (403)**
**Solution:** Run the insert_initial_data.py script
```bash
python3 insert_initial_data.py dev us-east-1 piyush@itrenaissancellc720.onmicrosoft.com
```

**Issue 3: "Insufficient permissions" (403)**
**Solution:** Make sure you're using an ADMIN user's email in `requesterEmail`

**Issue 4: "Internal server error" (500)**
**Solution:** Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/dev-rbac-get-users --follow
```

**Issue 5: CORS error in browser**
**Solution:** Update CORS settings in CloudFormation parameters (not needed for Postman)

**Issue 6: "Missing required fields" (400)**
**Solution:** Check the request body has all required fields for that endpoint

---

## Quick Reference

### Endpoints Requiring ADMIN Role

- `POST /users/list`
- `POST /users`
- `PATCH /users/{email}`
- `DELETE /users/{email}`
- `POST /roles`
- `DELETE /roles/{roleId}`
- `POST /routes`
- `PATCH /routes/{id}`
- `DELETE /routes/{id}`

### Endpoints Open to All

- `POST /auth/verify`
- `POST /auth/check-permission`
- `POST /auth/accessible-routes`
- `POST /roles/list`
- `POST /routes/list`

### Required Fields Summary

| Endpoint | Required Fields |
|----------|----------------|
| `/auth/verify` | `email` |
| `/auth/check-permission` | `email`, `route` |
| `/auth/accessible-routes` | `email` |
| `/users/list` | `email` (for permission check) |
| `/users` | `requesterEmail`, `email`, `role`, `displayName` |
| `/users/{email}` PATCH | `requesterEmail`, + at least one of: `role`, `isEnabled`, `displayName` |
| `/users/{email}` DELETE | `requesterEmail` |
| `/roles` | `requesterEmail`, `roleId`, `description`, `color` |
| `/roles/{roleId}` DELETE | `requesterEmail` |
| `/routes` | `requesterEmail`, `route`, `label`, `allowedRoles`, `description` |
| `/routes/{id}` PATCH | `requesterEmail`, + at least one field to update |
| `/routes/{id}` DELETE | `requesterEmail` |

---

## 🎉 You're Ready!

Save this documentation for reference. Import the Postman collection for easier testing, or use this guide to create requests manually.

**Happy Testing!** 🚀
