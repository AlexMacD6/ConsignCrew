# Admin Setup Guide for TreasureHub

This guide explains how to set up and use the admin functionality in TreasureHub using Better Auth's organization system.

## Overview

The admin system uses Better Auth's built-in organization feature to manage admin roles. Users with `ADMIN` or `OWNER` roles in any organization have access to the admin dashboard.

## Initial Setup

### 1. Run the Admin Setup Script

After creating your first user account, run the admin setup script to create the default admin organization and assign the first user as an admin:

```bash
node scripts/setup-admin.js
```

This script will:
- Create a default "TreasureHub Admin" organization
- Assign the first user as an `OWNER` of this organization
- Enable admin access for that user

### 2. Verify Admin Access

1. Log in with the user account that was set up as admin
2. Navigate to the Profile page
3. You should see an "Admin" tab with a shield icon
4. Click on the Admin tab to access the admin dashboard

## Admin Dashboard Features

### User Management
- **View All Users**: See all registered users with their organization memberships
- **Admin Status**: Visual indicators showing which users are admins
- **Organization Memberships**: View which organizations each user belongs to and their roles
- **Make Admin**: Quick action to assign admin role to any user
- **User Actions**: Edit and delete user accounts

### Organization Management
- **Create Organizations**: Add new organizations with name, slug, and logo
- **View Organizations**: See all organizations with member and team counts
- **Member Management**: View and manage members within each organization
- **Role Management**: Change member roles (MEMBER, ADMIN, OWNER)
- **Organization Actions**: Edit and delete organizations

### Content Management
- **Approved Zip Codes**: Manage seller and buyer zip codes
- **Add/Remove Zip Codes**: Add new zip codes or remove existing ones
- **Zip Code Types**: Separate management for seller and buyer zip codes

## Admin Roles

### OWNER
- Full control over the organization
- Can manage all members and their roles
- Can delete the organization
- Can assign other users as OWNER, ADMIN, or MEMBER

### ADMIN
- Can manage members (except other ADMINS and OWNERS)
- Can view organization settings
- Can assign users as MEMBER
- Cannot delete the organization or change OWNER roles

### MEMBER
- Basic access to organization features
- Cannot manage other members
- Cannot change organization settings

## API Endpoints

### Organizations
- `GET /api/admin/organizations` - Get all organizations
- `POST /api/admin/organizations` - Create new organization

### Organization Members
- `GET /api/admin/organizations/[id]/members` - Get organization members
- `POST /api/admin/organizations/[id]/members` - Add member to organization
- `PUT /api/admin/organizations/[id]/members/[memberId]` - Update member role
- `DELETE /api/admin/organizations/[id]/members/[memberId]` - Remove member

## Utility Functions

The admin system includes several utility functions in `app/lib/admin-utils.ts`:

- `isUserAdmin(userId)` - Check if user has admin privileges
- `getUserAdminOrganizations(userId)` - Get user's admin organizations
- `assignUserAsAdmin(userId, organizationId)` - Assign admin role to user
- `getAllUsersWithOrganizations()` - Get all users with organization data

## Security Considerations

1. **Admin Check**: The system checks if a user is ADMIN or OWNER in any organization before showing admin features
2. **API Protection**: All admin API endpoints verify admin status before allowing access
3. **Role Validation**: Only appropriate roles can perform certain actions
4. **Session Management**: Uses Better Auth's secure session management

## Adding New Admins

### Method 1: Via Admin Dashboard
1. Log in as an existing admin
2. Go to Profile → Admin → User Management
3. Find the user you want to make admin
4. Click "Make Admin" button
5. The user will be assigned ADMIN role in the first available organization

### Method 2: Via Organization Management
1. Go to Profile → Admin → Organization Management
2. Select an organization
3. Add a new member or change existing member's role to ADMIN
4. The user will have admin access

### Method 3: Programmatically
```javascript
import { assignUserAsAdmin } from '../lib/admin-utils';

// Assign user as admin to specific organization
await assignUserAsAdmin(userId, organizationId);
```

## Troubleshooting

### Admin Tab Not Showing
- Ensure the user is ADMIN or OWNER in at least one organization
- Check that the admin setup script was run successfully
- Verify the user's organization memberships in the database

### API Errors
- Check that the user is authenticated
- Verify the user has admin privileges
- Ensure the organization exists and user has access to it

### Database Issues
- Run `npx prisma migrate dev` to ensure all migrations are applied
- Check that the Better Auth organization models are properly set up
- Verify the database connection

## Future Enhancements

- **Bulk Operations**: Select multiple users/organizations for batch operations
- **Advanced Permissions**: Granular permission system for different admin levels
- **Audit Trail**: Track all admin actions for compliance
- **Email Notifications**: Notify users of role changes
- **Organization Invitations**: Send email invitations to join organizations
- **Team Management**: Manage teams within organizations 