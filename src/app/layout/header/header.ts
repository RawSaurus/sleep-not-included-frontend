import {Component, HostListener, inject, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NgClass} from '@angular/common';
import {AuthService} from '../../auth/auth.service';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

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
    window.location.href =
      'http://localhost:8443/realms/sni/protocol/openid-connect/registrations' +
      '?client_id=angular' +
      '&response_type=code' +
      '&scope=' +
      '&redirect_uri=http://localhost:4200/' + window.location.origin;
  }

  test(){
    this.getCurrentUser().subscribe({
      next: (response) => {
        console.log(response);
      }
    });
  }

  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>('http://localhost:8080/user/1');
  }


  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeDropdown();
    }
  }

}
