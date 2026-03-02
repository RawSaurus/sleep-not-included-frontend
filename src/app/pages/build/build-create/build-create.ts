import {Component, inject, OnInit, signal} from '@angular/core';
import {Router} from '@angular/router';
import {BuildControllerService} from '../../../api/build-service';
import {TagControllerService, TagResponse} from '../../../api/tag-service';
import {ImageControllerService} from '../../../api/image-service';
import {UserControllerService} from '../../../api/user-service';
import {AuthService} from '../../../auth/auth.service';
import {switchMap, forkJoin, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-build-create',
  imports: [],
  templateUrl: './build-create.html',
  styleUrl: './build-create.css',
})
export class BuildCreate implements OnInit{
  private router = inject(Router);
  private buildController = inject(BuildControllerService);
  private tagController = inject(TagControllerService);
  private imageController = inject(ImageControllerService);
  private userController = inject(UserControllerService);
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);

  // Form fields
  name = signal('');
  description = signal('');

  // Tags
  availableTags = signal<TagResponse[]>([]);
  selectedTagIds = signal<Set<number>>(new Set());

  // Images
  thumbnailFile = signal<File | null>(null);
  thumbnailPreview = signal<string | null>(null);
  buildImageFiles = signal<File[]>([]);
  buildImagePreviews = signal<string[]>([]);

  // UI state
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.tagController
      .findAll(0,50)
      .subscribe({
        next: (tags) => {
          console.log(tags);
          this.availableTags.set(tags.content ?? []);
        },
        error: () => this.error.set('Failed to load tags.'),
      });
  }

  toggleTag(tagId: number | undefined): void {
    if (tagId == null) return;
    const current = new Set(this.selectedTagIds());
    current.has(tagId) ? current.delete(tagId) : current.add(tagId);
    this.selectedTagIds.set(current);
  }

  isTagSelected(tagId: number | undefined): boolean {
    return tagId != null && this.selectedTagIds().has(tagId);
  }

  onThumbnailSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.thumbnailFile.set(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.thumbnailPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.thumbnailPreview.set(null);
    }
  }

  onBuildImagesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.buildImageFiles.set(files);

    const previews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target?.result as string);
        if (previews.length === files.length) {
          this.buildImagePreviews.set([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeBuildImage(index: number): void {
    const files = [...this.buildImageFiles()];
    const previews = [...this.buildImagePreviews()];
    files.splice(index, 1);
    previews.splice(index, 1);
    this.buildImageFiles.set(files);
    this.buildImagePreviews.set(previews);
  }

  cancel(): void {
    this.router.navigate(['/build']);
  }

  submit(): void {
    if (!this.name().trim()) {
      this.error.set('Build name is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const profile = this.authService.userProfile;
    const username: string = profile?.['preferred_username'] ?? '';

    // 1. Get internal user ID by username
    this.userController
      .findUserByName(username)
      .pipe(
        // 2. Create the build
        switchMap((user) => {
          const userId = user.id!;
          return this.buildController.createBuild(
            userId,
            {
              name: this.name(),
              description: this.description(),
              tagId: Array.from(this.selectedTagIds()),
            }
          ).pipe(
            // 3. Upload thumbnail + build images in parallel after build created
            switchMap((build) => {
              const buildName = build.name!;
              const uploads = [];

              const thumbnail = this.thumbnailFile();
              console.log('Thumbnail file: ', thumbnail);
              if (thumbnail) {
                uploads.push(this.uploadThumbnail(thumbnail, buildName));
              }

              const buildImages = this.buildImageFiles();
              if (buildImages.length > 0) {
                uploads.push(this.uploadBuildImages(buildImages, buildName));
              }

              return uploads.length > 0
                ? forkJoin(uploads).pipe(switchMap(() => { this.router.navigate(['/build', build.id]); return of(null); }))
                : of(null).pipe(switchMap(() => { this.router.navigate(['/build', build.id]); return of(null); }));
              // const buildName = build.name!;
              // const uploads: import('rxjs').Observable<object>[] = [];
              //
              // const thumbnail = this.thumbnailFile();
              // if (thumbnail) {
              //   // Convert File to base64 string for UpdateImageRequest
              //   uploads.push(
              //     this.imageController.uploadImage(
              //       'BUILD_THUMBNAIL',
              //       buildName,
              //       thumbnail
              //     )
              //   );
              // }
              //
              // const buildImages = this.buildImageFiles();
              // if (buildImages.length > 0) {
              //   uploads.push(
              //     this.imageController.uploadBuildImages(
              //       buildName,
              //       buildImages
              //     )
              //   );
              // }
              //
              // // If no images, just navigate
              // if (uploads.length === 0) {
              //   this.router.navigate(['/build', build.id]);
              //   return [];
              // }
              //
              // // const { forkJoin }  = require('rxjs');
              // // forkJoin(uploads).subscribe(() => {
              // //   this.router.navigate(['/build', build.id]);
              // // });
              // return forkJoin(uploads).pipe(
              //   // Navigate after all uploads done
              //   switchMap(() => {
              //     this.router.navigate(['/build', build.id]);
              //     return [];
              //   })
              // );
            })
          );
        })
      )
      .subscribe({
        error: (err) => {
          console.error(err);
          this.error.set('Something went wrong. Please try again.');
          this.isSubmitting.set(false);
        },
      });
  }

  private uploadThumbnail(file: File, buildName: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'BUILD_THUMBNAIL');
    return this.httpClient.post(
      `http://localhost:8080/image/upload/${buildName}`,
      formData
    );
  }

  private uploadBuildImages(files: File[], buildName: string) {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.httpClient.post(
      `http://localhost:8080/image/upload/build-images/${buildName}`,
      formData
    );
  }
}
