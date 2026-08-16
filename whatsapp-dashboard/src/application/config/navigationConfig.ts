/**
 * @file navigationConfig.ts
 * @description Configuración centralizada de rutas y permisos RBAC para el Panel 1 (Navigation Rail).
 * Aplica el principio Open/Closed (SOLID - O): agregar un nuevo módulo solo requiere un nuevo elemento aquí.
 */

export type UserRole = 'DEVELOPER' | 'USER_FULL_JS' | 'USER_HYBRID' | 'USER_FULL_AI';

export interface INavMenuItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly iconName: 'MessageSquare' | 'LayoutDashboard' | 'MessageCircleCode' | 'Users' | 'Calendar' | 'Settings' | 'Receipt';
  readonly allowedRoles: readonly UserRole[];
}

export const NAV_MENU_ITEMS: readonly INavMenuItem[] = [
  {
    id: 'chats',
    label: 'Chats',
    path: '/muestra',
    iconName: 'MessageSquare',
    allowedRoles: ['DEVELOPER', 'USER_FULL_JS', 'USER_HYBRID', 'USER_FULL_AI'],
  },
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/admin',
    iconName: 'LayoutDashboard',
    allowedRoles: ['DEVELOPER'],
  },
  {
    id: 'saludos',
    label: 'Saludos',
    path: '/admin/saludos',
    iconName: 'MessageCircleCode',
    allowedRoles: ['DEVELOPER'],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/admin/clientes',
    iconName: 'Users',
    allowedRoles: ['DEVELOPER'],
  },
  {
    id: 'calendario',
    label: 'Calendario',
    path: '/admin/calendario',
    iconName: 'Calendar',
    allowedRoles: ['DEVELOPER'],
  },
  {
    id: 'configuraciones',
    label: 'Configuración',
    path: '/admin/configuracion',
    iconName: 'Settings',
    allowedRoles: ['DEVELOPER'],
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    path: '/admin/facturacion',
    iconName: 'Receipt',
    allowedRoles: ['DEVELOPER'],
  },
];
