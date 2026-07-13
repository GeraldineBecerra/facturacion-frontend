import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ReloadRouteReuseStrategy extends BaseRouteReuseStrategy {
  private reloadPending = false;

  reloadNextNavigation(): void {
    this.reloadPending = true;
  }

  override shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    // Conserva el layout (navbar y sidebar) y reconstruye únicamente la vista activa.
    if (this.reloadPending && !future.firstChild) {
      this.reloadPending = false;
      return false;
    }

    return super.shouldReuseRoute(future, current);
  }
}
