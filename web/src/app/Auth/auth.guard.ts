import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorage } from './token-storage.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(TokenStorage);
  const router = inject(Router);
  if (store.isLogged()) return true;
  router.navigate(['/login']);
  return false;
};
