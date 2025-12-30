/**
 * Permission checking utilities for RBAC system
 */

export type Permission = 
  | 'users.manage' 
  | 'users.view' 
  | 'products.manage' 
  | 'products.view' 
  | 'orders.manage' 
  | 'orders.view' 
  | 'reports.view' 
  | 'settings.manage'
  | 'admins.manage'
  | 'admins.view'
  | 'tickets.manage'
  | 'tickets.view'
  | 'all';

export interface RoutePermission {
  route: string;
  requiredPermissions: Permission[];
  requireAll?: boolean; // If true, user needs ALL permissions, otherwise ANY
}

// Route to permission mapping
export const routePermissions: Record<string, RoutePermission> = {
  '/': { route: '/', requiredPermissions: [] }, // Dashboard - everyone can access
  '/users': { route: '/users', requiredPermissions: ['users.view', 'users.manage'], requireAll: false },
  '/admins': { route: '/admins', requiredPermissions: ['admins.view', 'admins.manage'], requireAll: false },
  '/statistics': { route: '/statistics', requiredPermissions: ['reports.view'] },
  '/withdrawals': { route: '/withdrawals', requiredPermissions: ['users.manage', 'reports.view'], requireAll: false },
  '/licenses': { route: '/licenses', requiredPermissions: ['products.manage', 'products.view'], requireAll: false },
  '/tickets': { route: '/tickets', requiredPermissions: ['tickets.view', 'tickets.manage'], requireAll: false },
  '/suppliers': { route: '/suppliers', requiredPermissions: ['products.manage', 'products.view'], requireAll: false },
  '/products/available': { route: '/products/available', requiredPermissions: ['products.view', 'products.manage'], requireAll: false },
  '/products/research': { route: '/products/research', requiredPermissions: ['products.view', 'products.manage'], requireAll: false },
  '/visitors': { route: '/visitors', requiredPermissions: ['reports.view'] },
  '/popups': { route: '/popups', requiredPermissions: ['settings.manage', 'products.manage'], requireAll: false },
  '/notifications': { route: '/notifications', requiredPermissions: ['users.manage', 'settings.manage'], requireAll: false },
};

// Sidebar item to permission mapping
export const sidebarItemPermissions: Record<string, Permission[]> = {
  'users': ['users.view', 'users.manage'],
  'admins': ['admins.view', 'admins.manage'],
  'statistics': ['reports.view'],
  'withdrawals': ['users.manage', 'reports.view'],
  'licenses': ['products.view', 'products.manage'],
  'tickets': ['tickets.view', 'tickets.manage'],
  'suppliers': ['products.view', 'products.manage'],
  'products/available': ['products.view', 'products.manage'],
  'products/research': ['products.view', 'products.manage'],
  'visitors': ['reports.view'],
  'popups': ['settings.manage', 'products.manage'],
  'notifications': ['users.manage', 'settings.manage'],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: Permission[] | string[], permission: Permission): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  
  // Super admin with 'all' permission has access to everything
  if (userPermissions.includes('all')) return true;
  
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: Permission[] | string[], requiredPermissions: Permission[]): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (!requiredPermissions || requiredPermissions.length === 0) return true; // No requirements = accessible
  
  // Super admin with 'all' permission has access to everything
  if (userPermissions.includes('all')) return true;
  
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(userPermissions: Permission[] | string[], requiredPermissions: Permission[]): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (!requiredPermissions || requiredPermissions.length === 0) return true; // No requirements = accessible
  
  // Super admin with 'all' permission has access to everything
  if (userPermissions.includes('all')) return true;
  
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(userPermissions: Permission[] | string[], route: string): boolean {
  const routePermission = routePermissions[route];
  if (!routePermission) return true; // Unknown route - allow access (should be protected separately)
  
  if (!routePermission.requiredPermissions || routePermission.requiredPermissions.length === 0) {
    return true; // No permission required
  }
  
  if (routePermission.requireAll) {
    return hasAllPermissions(userPermissions, routePermission.requiredPermissions);
  }
  
  return hasAnyPermission(userPermissions, routePermission.requiredPermissions);
}

/**
 * Check if user can see a sidebar item
 */
export function canSeeSidebarItem(userPermissions: Permission[] | string[], itemPath: string): boolean {
  const permissions = sidebarItemPermissions[itemPath];
  if (!permissions || permissions.length === 0) return true; // No permission required
  
  return hasAnyPermission(userPermissions, permissions);
}

