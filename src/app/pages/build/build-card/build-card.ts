import {Component, inject, input, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BuildControllerService, BuildDetailResponse, BuildResponse} from '../../../api/build-service';
import {AuthService} from '../../../auth/auth.service';

@Component({
  selector: 'app-build-card',
  imports: [
    RouterLink
  ],
  templateUrl: './build-card.html',
  styleUrl: './build-card.css',
})
export class BuildCard implements OnInit{

  build = input.required<BuildDetailResponse>();

  private authService = inject(AuthService);
  private buildController = inject(BuildControllerService);

  isLiked = signal<boolean>(false);
  likesCount = signal<number>(0);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  ngOnInit(): void {
    this.isLiked.set(this.build().isLiked ?? false);
    this.likesCount.set(this.build().likes ?? 0);
  }

  toggleLike(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const b = this.build();
    if (!b?.id || !this.isLoggedIn) return;

    // Optimistic update — change immediately before server responds
    const previousLiked = this.isLiked();
    const previousCount = this.likesCount();
    this.isLiked.set(!previousLiked);
    this.likesCount.set(previousCount + (previousLiked ? -1 : 1));

    this.buildController.likeBuild(b.id).subscribe({
      error: () => {
        // Rollback on failure
        this.isLiked.set(previousLiked);
        this.likesCount.set(previousCount);
        console.error('Failed to toggle like');
      }
    });
  }
}
