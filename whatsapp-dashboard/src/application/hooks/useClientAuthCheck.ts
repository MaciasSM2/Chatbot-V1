import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { executeSecureRequest, getApiUrl } from '../../core/apiClient';

export function useClientAuthCheck() {
  const router = useRouter();
  const [isAuthVerified, setIsAuthVerified] = useState<boolean>(false);
  const [operatorContext, setOperatorContext] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    async function verifyFronteraSession() {
      const sessionCheck = await executeSecureRequest(getApiUrl('/admin/settings/brand'));

      if (!sessionCheck.success) {
        console.warn('Access denied at client perimeter. Redirecting...');
        router.replace('/auth/login');
      } else {
        setOperatorContext({
          email: sessionCheck.data?.userContext?.email || 'operador@logistica.com',
          role: sessionCheck.data?.userContext?.role || 'OPERATOR'
        });
        setIsAuthVerified(true);
      }
    }

    verifyFronteraSession();
  }, [router]);

  return { isAuthVerified, operatorContext };
}
