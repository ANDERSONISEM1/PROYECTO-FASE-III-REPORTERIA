import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment, Route } from '@angular/router';
import { TokenStorage } from './token-storage.service';

export function roleGuard(allowed: string[]): CanMatchFn {
  return (_route: Route, _segments: UrlSegment[]) => {
    const store = inject(TokenStorage);
    const router = inject(Router);
    if (!store.isLogged()) { router.navigate(['/login']); return false; }
    const ok = store.roles.some(r => allowed.includes(r));
    if (!ok) router.navigate(['/visor']);
    return ok;
  };
}
