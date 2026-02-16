import {Component, HostListener, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NgClass} from '@angular/common';

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

  calculatorOpen = signal(false);

  toggleCalculator() {
    this.calculatorOpen.update(v => !v);
  }

  closeDropdown() {
    this.calculatorOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeDropdown();
    }
  }

}
