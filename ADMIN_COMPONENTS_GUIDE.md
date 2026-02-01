# Admin Management Components - Implementation Guide

This guide documents the comprehensive admin management components for Users, Roles, and Routes with full CRUD operations integrated with AWS RBAC API.

## 📁 Files Created/Modified

### **1. AWS RBAC Service (`lib/aws-rbac-service.ts`)**
Complete service layer with all CRUD operations:

#### User Management Methods:
- `listUsers(requesterEmail)` - Get all users (ADMIN only)
- `createUser(requesterEmail, email, role, displayName)` - Create new user
- `updateUser(requesterEmail, email, updates)` - Update user role, status, or display name
- `deleteUser(requesterEmail, email)` - Delete user

#### Role Management Methods:
- `listRoles()` - Get all roles
- `createRole(requesterEmail, roleId, description, color)` - Create custom role
- `deleteRole(requesterEmail, roleId)` - Delete custom role (cannot delete system roles)

#### Route Management Methods:
- `listRoutes()` - Get all routes
- `createRoute(requesterEmail, route, label, allowedRoles, description)` - Create new route
- `updateRoute(requesterEmail, routeId, updates)` - Update route permissions, status, label, or description
- `deleteRoute(requesterEmail, routeId)` - Delete route

---

## 🧑‍💼 User Management Page

**File:** `app/admin/users/page.tsx`

### Features:
✅ **List all users** with search functionality
✅ **Create new users** with email, display name, and role
✅ **Edit users** - update role, display name, and status
✅ **Enable/Disable users** - toggle user account status
✅ **Delete users** with confirmation dialog
✅ **View accessible routes** for each user
✅ **Refresh data** button
✅ **Real-time role badges** with color coding
✅ **Last login tracking**

### UI Components:
- **Search Bar**: Filter users by email or display name
- **User Table**: Displays all users with:
  - Display Name & Email
  - Role Badge (color-coded)
  - Status Badge (Active/Disabled)
  - Last Login Date
  - Action Buttons (View, Edit, Toggle Status, Delete)

### Dialogs:
1. **Add User Dialog**
   - Email Address (must match Microsoft Entra ID)
   - Display Name
   - Role Selection (with system role indicators)

2. **Edit User Dialog**
   - Email (read-only)
   - Display Name (editable)
   - Role Selection
   - Enable/Disable Toggle

3. **View Routes Dialog**
   - Shows all accessible routes for the user
   - Route details with descriptions
   - Enabled/Disabled status

4. **Delete Confirmation Dialog**
   - Shows user email
   - Cannot delete yourself

### API Integration:
```typescript
// Create User
await awsRBACService.createUser(
  currentUser.email,
  newUser.email,
  newUser.role,
  newUser.displayName
)

// Update User
await awsRBACService.updateUser(
  currentUser.email,
  userEmail,
  { role: "ANALYST", isEnabled: false, displayName: "New Name" }
)

// Delete User
await awsRBACService.deleteUser(currentUser.email, userEmail)

// Get User Routes
const response = await awsRBACService.getAccessibleRoutes(userEmail)
```

---

## 🔐 RBAC Management Page

**File:** `app/admin/rbac-new/page.tsx`

### Features:
✅ **Two-tab interface** (Routes & Roles)
✅ **Create custom roles** with color themes
✅ **Delete custom roles** (system roles protected)
✅ **Create routes** with role permissions
✅ **Edit routes** - update label, description, permissions, status
✅ **Toggle route status** (enable/disable)
✅ **Inline role permission editing** with checkboxes
✅ **Delete routes** with confirmation
✅ **Real-time permission updates**
✅ **Auto-refresh accessible routes** after changes

### Routes Tab

#### Features:
- **Route Table** with:
  - Route Path (URL)
  - Display Label
  - Allowed Roles (inline checkboxes for quick editing)
  - Enabled/Disabled Toggle
  - Edit & Delete Actions

- **Add Route Dialog**:
  - Route Path (e.g., `/reports/custom`)
  - Display Label
  - Description (multi-line)
  - Role Selection (checkboxes with color badges)

- **Edit Route Dialog**:
  - Path (read-only)
  - Label (editable)
  - Description (editable)
  - Role Selection (checkboxes)
  - Enable/Disable Toggle

#### Quick Role Permission Editing:
Each route row has checkboxes for every role. Click to instantly grant/revoke access without opening dialogs.

### Roles Tab

#### Features:
- **Role Cards** displaying:
  - Role ID Badge (color-coded)
  - System/Custom indicator
  - Description
  - Number of accessible routes
  - Delete button (disabled for system roles)

- **Add Role Dialog**:
  - Role ID (auto-uppercased)
  - Description (multi-line)
  - Color Theme Selector (8 preset colors)
    - Red, Blue, Green, Purple, Yellow, Orange, Pink, Gray

#### System Roles (Cannot Delete):
- **ADMIN** - Full system access
- **SUPERVISOR** - Team oversight and reporting
- **ANALYST** - Read-only access

### API Integration:
```typescript
// Create Role
await awsRBACService.createRole(
  currentUser.email,
  "MANAGER",
  "Team management access",
  "bg-purple-500/10 text-purple-500 border-purple-500/20"
)

// Delete Role
await awsRBACService.deleteRole(currentUser.email, "MANAGER")

// Create Route
await awsRBACService.createRoute(
  currentUser.email,
  "/reports/custom",
  "Custom Reports",
  ["ADMIN", "SUPERVISOR"],
  "Create and view custom reports"
)

// Update Route (inline or dialog)
await awsRBACService.updateRoute(
  currentUser.email,
  routeId,
  { 
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
    label: "Advanced Reports",
    description: "Updated description"
  }
)

// Delete Route
await awsRBACService.deleteRoute(currentUser.email, routeId)
```

---

## 🎨 Color Themes for Roles

Pre-defined Tailwind color schemes:
```typescript
const COLOR_OPTIONS = [
  { value: "bg-red-500/10 text-red-500 border-red-500/20", label: "Red" },
  { value: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Blue" },
  { value: "bg-green-500/10 text-green-500 border-green-500/20", label: "Green" },
  { value: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Purple" },
  { value: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Yellow" },
  { value: "bg-orange-500/10 text-orange-500 border-orange-500/20", label: "Orange" },
  { value: "bg-pink-500/10 text-pink-500 border-pink-500/20", label: "Pink" },
  { value: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Gray" },
]
```

---

## 🔒 Security & Permissions

### ADMIN-Only Operations:
- Creating users
- Updating users
- Deleting users
- Creating roles
- Deleting roles
- Creating routes
- Updating routes
- Deleting routes

### Protected Actions:
- **Cannot delete yourself** (current user)
- **Cannot delete system roles** (ADMIN, SUPERVISOR, ANALYST)
- **Cannot delete default admin** (first admin user)
- All operations require `requesterEmail` for audit trail

### Error Handling:
All operations include:
- Try-catch blocks
- Toast notifications for success/error
- Descriptive error messages from API
- Loading states
- Confirmation dialogs for destructive actions

---

## 🔄 Real-Time Updates

### Auto-Refresh Features:
1. **After creating/updating/deleting routes**:
   - Calls `await refreshRoutes()` to update sidebar
   - User sees changes immediately in navigation

2. **Manual Refresh**:
   - Refresh button on both pages
   - Re-fetches data from AWS API

3. **Optimistic Updates**:
   - Local state updated immediately
   - If API call fails, shows error and reverts

---

## 📊 Data Flow

```
User Action → Component Handler → AWS RBAC Service → AWS API
                                         ↓
                          Update Local State ← API Response
                                         ↓
                          Refresh Routes (if needed)
                                         ↓
                          Show Success Toast
```

---

## 🧪 Testing Checklist

### User Management:
- [ ] Create user with all roles
- [ ] Edit user role
- [ ] Edit user display name
- [ ] Enable/Disable user
- [ ] View user's accessible routes
- [ ] Delete user
- [ ] Try to delete yourself (should fail)
- [ ] Search users by email/name

### Role Management:
- [ ] Create custom role
- [ ] Try different color themes
- [ ] Delete custom role
- [ ] Try to delete system role (should fail)
- [ ] Verify route count updates

### Route Management:
- [ ] Create route with multiple roles
- [ ] Edit route label and description
- [ ] Toggle route enabled/disabled
- [ ] Add/remove roles inline (checkbox)
- [ ] Delete route
- [ ] Verify sidebar updates automatically

---

## 🚀 Usage Example

### Creating a Complete RBAC Setup:

1. **Create a Custom Role**:
   - Go to RBAC → Roles tab
   - Click "Add Role"
   - Role ID: `MANAGER`
   - Description: `Team management and reporting access`
   - Color: Purple
   - Click "Create Role"

2. **Create Routes for the Role**:
   - Go to Routes tab
   - Click "Add Route"
   - Route: `/team/performance`
   - Label: `Team Performance`
   - Description: `View team metrics and KPIs`
   - Select Roles: ADMIN, MANAGER
   - Click "Create Route"

3. **Add Users with the Role**:
   - Go to User Management
   - Click "Add User"
   - Email: `manager@company.com`
   - Display Name: `Team Manager`
   - Role: MANAGER
   - Click "Create User"

4. **Test Access**:
   - User logs in with Microsoft Entra ID
   - AWS API verifies user exists
   - Sidebar shows only `/team/performance` (plus common routes)
   - User can access assigned routes only

---

## 📝 API Request Examples

### Create User
```bash
POST /users
{
  "requesterEmail": "admin@company.com",
  "email": "newuser@company.com",
  "role": "ANALYST",
  "displayName": "New User"
}
```

### Update User
```bash
PATCH /users/newuser@company.com
{
  "requesterEmail": "admin@company.com",
  "role": "SUPERVISOR",
  "isEnabled": true
}
```

### Create Role
```bash
POST /roles
{
  "requesterEmail": "admin@company.com",
  "roleId": "MANAGER",
  "description": "Team management access",
  "color": "bg-purple-500/10 text-purple-500 border-purple-500/20"
}
```

### Create Route
```bash
POST /routes
{
  "requesterEmail": "admin@company.com",
  "route": "/reports/custom",
  "label": "Custom Reports",
  "allowedRoles": ["ADMIN", "SUPERVISOR"],
  "description": "Create custom reports"
}
```

### Update Route
```bash
PATCH /routes/{routeId}
{
  "requesterEmail": "admin@company.com",
  "allowedRoles": ["ADMIN", "SUPERVISOR", "ANALYST"],
  "isEnabled": true
}
```

---

## 🎯 Next Steps

1. **Navigate to**: `/admin/users` for User Management
2. **Navigate to**: `/admin/rbac-new` for RBAC Management (new comprehensive version)
3. **Old RBAC page**: `/admin/rbac` (can be removed or kept for comparison)

4. **Add to Navigation** (if not already there):
   - User Management should be ADMIN-only route
   - RBAC Settings should be ADMIN-only route

5. **Test Flow**:
   - Login as ADMIN
   - Create custom roles and routes
   - Add users with different roles
   - Login as different users to verify permissions

---

## 🐛 Troubleshooting

### "User not authorized" error:
- Ensure user exists in AWS RBAC system
- Email must match Microsoft Entra ID account

### "Insufficient permissions" error:
- Only ADMIN users can manage users, roles, and routes
- Check current user's role

### Changes not reflected in sidebar:
- Refresh button should trigger update
- Try logging out and back in
- Check if route `isEnabled` is true

### Cannot delete role:
- System roles (ADMIN, SUPERVISOR, ANALYST) cannot be deleted
- Check if role is assigned to any users

---

## ✅ Summary

You now have complete admin management interfaces with:
- **User Management** with full CRUD
- **Role Management** with custom roles and color themes
- **Route Management** with inline permission editing
- **Real-time updates** to navigation
- **Comprehensive error handling**
- **AWS RBAC API integration**
- **Microsoft Entra ID authentication**

All components follow the existing design system and integrate seamlessly with your authentication flow.
