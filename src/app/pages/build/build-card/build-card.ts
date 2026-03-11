import {Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BuildControllerService, BuildDetailResponse, BuildResponse} from '../../../api/build-service';
import {AuthService} from '../../../auth/auth.service';
import {UserControllerService} from '../../../api/user-service';

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

  // Image carousel state
  currentImageIndex = signal<number>(0);

  /** All images: thumbnail first, then build images */
  allImages = computed<string[]>(() => {
    const b = this.build();
    const images: string[] = [];
    if (b.thumbnailUrl) images.push(b.thumbnailUrl);
    if (b.imageUrls?.length) images.push(...b.imageUrls);
    return images;
  });

  /** Max 5 tags */
  displayTags = computed(() => (this.build().tags ?? []).slice(0, 5));

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  ngOnInit(): void {
    this.isLiked.set(this.build().isLiked ?? false);
    this.likesCount.set(this.build().likes ?? 0);
  }

  prevImage(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const total = this.allImages().length;
    if (total <= 1) return;
    this.currentImageIndex.update(i => (i - 1 + total) % total);
  }

  nextImage(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const total = this.allImages().length;
    if (total <= 1) return;
    this.currentImageIndex.update(i => (i + 1) % total);
  }

  goToImage(event: MouseEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.currentImageIndex.set(index);
  }

  toggleLike(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const b = this.build();
    if (!b?.id || !this.isLoggedIn) return;

    const previousLiked = this.isLiked();
    const previousCount = this.likesCount();
    this.isLiked.set(!previousLiked);
    this.likesCount.set(previousCount + (previousLiked ? -1 : 1));

    this.buildController.likeBuild(b.id).subscribe({
      error: () => {
        this.isLiked.set(previousLiked);
        this.likesCount.set(previousCount);
        console.error('Failed to toggle like');
      }
    });
  }
}
