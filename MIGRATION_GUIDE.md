# Migration Guide: Redis to Microsoft Entra ID + AWS RBAC

This guide documents the migration from Redis-based authentication/RBAC to Microsoft Entra ID authentication with AWS RBAC API.

## Architecture Overview

### Previous Architecture (Redis)
- **Authentication**: Username/password stored in Redis
- **RBAC**: Roles and permissions stored in Redis
- **Session Management**: Local session storage

### New Architecture
- **Authentication**: Microsoft Entra ID (Azure AD) OAuth 2.0
- **RBAC**: AWS API Gateway + Lambda (DynamoDB backend)
- **Session Management**: JWT tokens from Microsoft + user data from AWS API

## Changes Made

### 1. New Service Layers

#### **`lib/aws-rbac-service.ts`**
Service layer for all AWS RBAC API interactions:
- `verifyUser(email)` - Verify user exists and get role
- `getAccessibleRoutes(email)` - Get all routes user can access
- `checkPermission(email, route)` - Check specific route permission
- User, role, and route management (ADMIN only)

#### **`lib/microsoft-auth-service.ts`**
Service layer for Microsoft Entra ID:
- `getAuthUrl()` - Generate Microsoft OAuth URL
- `extractAccessToken(hash)` - Extract token from callback
- `getUserInfo(accessToken)` - Fetch user from Microsoft Graph
- Token storage management

#### **`lib/msal-config.ts`**
Microsoft Authentication Library configuration:
- Client ID and Tenant ID from environment variables
- Redirect URI configuration
- OAuth scopes

### 2. Updated Components

#### **`hooks/use-auth.tsx`**
Completely rewritten authentication hook:
- **Before**: Email/password login with Redis
- **After**: Microsoft SSO with AWS RBAC verification
- New features:
  - `accessToken` - Microsoft access token
  - `accessibleRoutes` - Dynamic routes from AWS API
  - `refreshRoutes()` - Refresh user permissions
  - `login()` - Redirect to Microsoft login
  - `completeAuthLogin()` - Complete auth after callback

#### **`components/dashboard-layout.tsx`**
Dynamic sidebar based on AWS RBAC:
- **Before**: Static routes filtered by local permissions
- **After**: Routes fetched from AWS API based on user role
- Automatically updates when permissions change
- Shows "No accessible routes" when user has no permissions

#### **`app/login/page.tsx`**
Microsoft SSO login page:
- **Before**: Email/password form
- **After**: "Sign in with Microsoft" button
- Modern UI with Microsoft branding
- Explains AWS RBAC verification process

#### **`app/auth/callback/page.tsx`** (NEW)
OAuth callback handler:
- Extracts access token from Microsoft redirect
- Fetches user info from Microsoft Graph
- Verifies user with AWS RBAC API
- Stores session and redirects to dashboard
- Error handling with user feedback

### 3. Configuration Files

#### **`.env.example`**
Template for environment variables:
```bash
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AWS_API_URL=https://your-api-url.execute-api.region.amazonaws.com/dev
```

#### **`middleware.ts`** (NEW)
Route protection:
- Public routes: `/login`, `/auth/callback`
- All other routes require authentication (checked client-side)

## Setup Instructions

### 1. Configure Microsoft Entra ID

1. Go to Azure Portal → Azure Active Directory
2. Register a new application
3. Note the **Application (client) ID** and **Directory (tenant) ID**
4. Add redirect URI: `http://localhost:3000/auth/callback` (and production URL)
5. Under "API permissions", add:
   - `User.Read`
   - `openid`
   - `profile`

### 2. Configure AWS RBAC API

According to the API documentation, your AWS API should be deployed via CloudFormation with endpoints:

**Authentication Endpoints:**
- `POST /auth/verify` - Verify user and get role
- `POST /auth/check-permission` - Check route permission
- `POST /auth/accessible-routes` - Get user's accessible routes

**Management Endpoints (ADMIN only):**
- `POST /users/list` - List all users
- `POST /users` - Create user
- `PATCH /users/{email}` - Update user
- `DELETE /users/{email}` - Delete user
- `POST /roles/list` - List all roles
- `POST /roles` - Create role
- `DELETE /roles/{roleId}` - Delete role
- `POST /routes/list` - List all routes
- `POST /routes` - Create route
- `PATCH /routes/{id}` - Update route
- `DELETE /routes/{id}` - Delete route

Get your API URL from CloudFormation outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name RoleBaseControl \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

### 3. Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update with your values:
```bash
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=3e8799c9-f60e-4bbd-8313-a91688c3d44d
NEXT_PUBLIC_AZURE_AD_TENANT_ID=c42f44e3-dca8-43ac-bfd0-9f2bbdce6c7a
NEXT_PUBLIC_AWS_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

### 4. Add Users to AWS RBAC

Before users can log in, they must exist in your AWS RBAC system:

1. Use the AWS RBAC admin panel or API to add users
2. User email in AWS RBAC must match Microsoft Entra ID email
3. Assign appropriate roles (ADMIN, SUPERVISOR, ANALYST, etc.)

Example API call:
```bash
curl -X POST https://your-api-url/dev/users \
  -H "Content-Type: application/json" \
  -d '{
    "requesterEmail": "admin@company.com",
    "email": "newuser@company.com",
    "role": "ANALYST",
    "displayName": "New User"
  }'
```

### 5. Run the Application

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000/login`

## Authentication Flow

1. **User clicks "Sign in with Microsoft"**
   - Redirected to Microsoft login page
   - User authenticates with Microsoft credentials

2. **Microsoft redirects to `/auth/callback`**
   - Access token extracted from URL hash
   - User info fetched from Microsoft Graph API

3. **AWS RBAC Verification**
   - `POST /auth/verify` called with user email
   - Returns user role and status
   - If user doesn't exist or is disabled, login fails

4. **Session Creation**
   - Access token stored in localStorage
   - User data stored in localStorage
   - Accessible routes fetched from AWS API

5. **Redirect to Dashboard**
   - User sees only routes they have permission to access
   - Sidebar is dynamically populated from AWS RBAC

## Dynamic Sidebar Behavior

The sidebar automatically:
- Fetches routes from AWS RBAC API on login
- Filters by user's role and route enabled status
- Updates when permissions change
- Shows icons for each route
- Highlights active route

**Role-Based Access Examples:**

| Role | Dashboard | Queue Matrix | Real-Time Metrics | Admin Users | RBAC Settings |
|------|-----------|--------------|-------------------|-------------|---------------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| SUPERVISOR | ✅ | ✅ | ✅ | ❌ | ❌ |
| ANALYST | ✅ | ✅ | ❌ | ❌ | ❌ |

## Removed Files/Code

The following Redis-related code has been replaced but not deleted (for reference):

- `lib/db.ts` - Redis connection and operations
- Old login logic in `hooks/use-auth.tsx`
- Static permission configuration in `config/permissions`
- Old callback logic in `Callback.js` and `App.js` (root level)

**You can safely remove:**
- `@upstash/redis` dependency from package.json
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` from environment variables
- Old `App.js`, `Callback.js`, `Dashboard.js` in root directory (replaced by Next.js pages)

## Troubleshooting

### Issue: "User not authorized" after Microsoft login
**Solution**: Ensure the user exists in AWS RBAC with the same email as Microsoft Entra ID

### Issue: "No accessible routes" in sidebar
**Solution**: 
- Check user's role in AWS RBAC
- Verify routes are enabled in AWS RBAC
- Check route permissions include the user's role

### Issue: Microsoft login redirect fails
**Solution**: 
- Verify redirect URI in Azure AD matches exactly (including protocol and port)
- Check client ID and tenant ID in `.env.local`

### Issue: CORS errors when calling AWS API
**Solution**: 
- Ensure CORS is configured in your API Gateway
- Add your domain to allowed origins

## API Testing

Use the provided `COMPLETE_POSTMAN_API_DOCUMENTATION.md` to test your AWS RBAC API endpoints directly.

## Security Notes

1. **Access tokens** are stored in localStorage (not cookies) for SPA architecture
2. **User verification** happens on every login via AWS RBAC API
3. **Route permissions** are enforced client-side AND should be enforced server-side in your API
4. **Microsoft tokens** expire - implement token refresh if needed
5. **HTTPS required** in production for OAuth callbacks

## Next Steps

1. ✅ Configure Microsoft Entra ID application
2. ✅ Deploy AWS RBAC API (if not done already)
3. ✅ Set environment variables
4. ✅ Add initial users to AWS RBAC
5. ✅ Test login flow
6. ✅ Test role-based sidebar access
7. Consider implementing:
   - Token refresh logic
   - Session timeout warnings
   - Audit logging for permission changes
   - API error retry logic

## Support

For AWS RBAC API issues, refer to `COMPLETE_POSTMAN_API_DOCUMENTATION.md`

For Microsoft Entra ID issues, refer to [Microsoft Identity Platform documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
