import {Component, HostListener, inject, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NgClass} from '@angular/common';
import {AuthService} from '../../auth/auth.service';
import {Observable} from 'rxjs';
import {HttpClient, HttpContext, HttpRequest, HttpResponse} from '@angular/common/http';
import {RequestParameter} from '@angular/cli/src/analytics/analytics-parameters';

export interface UserResponse {
  id: number;
  keycloakId: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgClass
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

  auth = false;
  authService = inject(AuthService);
  http = inject(HttpClient);

  calculatorOpen = signal(false);

  toggleCalculator() {
    this.calculatorOpen.update(v => !v);
  }

  closeDropdown() {
    this.calculatorOpen.set(false);
  }

  register() {
    this.authService.register();
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeDropdown();
    }
  }

}
