'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, UserRole } from '../../application/store/useAuthStore';

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function RouteGuard({ children, allowedRoles }: Props) {
  const { currentUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Permite a todos los perfiles de usuario navegar libremente por los módulos unlocked
    if (allowedRoles && allowedRoles.length > 0 && currentUser.role !== 'DEVELOPER') {
      const isAllowed = allowedRoles.includes(currentUser.role);
      // Si la ruta no está explícitamente permitida y no es un path común de admin/muestra
      if (!isAllowed && !pathname.startsWith('/admin') && pathname !== '/muestra') {
        router.push('/admin');
      }
    }
  }, [currentUser, pathname, allowedRoles, router]);

  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-bg-main text-text-main flex items-center justify-center font-mono text-xs">
        Autenticando sesión...
      </div>
    );
  }

  return <>{children}</>;
}
