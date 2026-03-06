import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildControllerService, BuildDetailResponse, BuildResponse} from '../../../api/build-service';
import {AuthService} from '../../../auth/auth.service';

@Component({
  selector: 'app-build-detail',
  imports: [],
  templateUrl: './build-detail.html',
  styleUrl: './build-detail.css',
})
export class BuildDetail implements OnInit{
  // private route = inject(ActivatedRoute);
  // private service = inject(BuildService);
  //
  // build = this.service.getById(
  //   Number(this.route.snapshot.paramMap.get('id'))
  // );
  private route = inject(ActivatedRoute);
  private buildController = inject(BuildControllerService);
  private authService = inject(AuthService);

  build = signal<BuildDetailResponse | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.buildController.findBuildDetailsById(id)
      .subscribe({
        next: (res) => {
          this.build.set(res);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Build not found or failed to load.');
          this.isLoading.set(false);
        }
      });
  }

  toggleLike(): void {
    const b = this.build();
    if (!b?.id || !this.isLoggedIn) return;

    this.buildController.likeBuild(b.id).subscribe({
      next: () => {
        this.build.update(current => {
          if (!current) return current;
          const liked = !current.isLiked;
          return {
            ...current,
            isLiked: liked,
            likes: (current.likes ?? 0) + (liked ? 1 : -1)
          };
        });
      },
      error: (err) => console.error('Failed to toggle like', err)
    });
  }
}
