import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {Router} from '@angular/router';
import {BuildControllerService, BuildDetailResponse} from '../../../api/build-service';
import {TagControllerService, TagResponse} from '../../../api/tag-service';
import {ImageControllerService} from '../../../api/image-service';
import {UserControllerService} from '../../../api/user-service';
import {AuthService} from '../../../auth/auth.service';
import {switchMap, forkJoin, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_COUNT = 20;

@Component({
  selector: 'app-build-create',
  imports: [],
  templateUrl: './build-create.html',
  styleUrl: './build-create.css',
})
export class BuildCreate implements OnInit{

  existingBuild = input<BuildDetailResponse | null>(null);
  editCancelled = output<void>();
  editSaved = output<BuildDetailResponse>();

  private router = inject(Router);
  private buildController = inject(BuildControllerService);
  private tagController = inject(TagControllerService);
  private imageController = inject(ImageControllerService);
  private userController = inject(UserControllerService);
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);

  // Form fields
  name = signal('');
  shortDescription = signal('');
  description = signal('');

  // Tags
  availableTags = signal<TagResponse[]>([]);
  selectedTagIds = signal<Set<number>>(new Set());

  // Images
  thumbnailFile = signal<File | null>(null);
  thumbnailPreview = signal<string | null>(null);

  // existingThumbnailUrl = signal<string | null>(null);
  // existingImgUrls = signal<string[]>([]);
  // imagesToDelete = signal<Set<string>>(new Set())

  buildImageFiles = signal<File[]>([]);
  buildImagePreviews = signal<string[]>([]);

  // Drag-&-Drop
  isDraggingThumbnail = signal(false);
  isDraggingImages = signal(false);

  // UI state
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  readonly maxImageCount = MAX_IMAGE_COUNT;

  get isEditMode(){
    return this.existingBuild !== null;
  }

  ngOnInit(): void {
    this.tagController
      .findAll(0,50)
      .subscribe({
        next: (tags) => {
          console.log(tags);
          this.availableTags.set(tags.content ?? []);
          this.prefillIfEditMode();
        },
        error: () => this.error.set('Failed to load tags.'),
      });

    const build = this.existingBuild();
    if(build){
      this.name.set(build.name ?? '');
      this.shortDescription.set(build.shortDescription ?? '');
      this.description.set(build.description ?? '');
      if(build.thumbnailUrl){
        this.thumbnailPreview.set(build.thumbnailUrl);
      }
      if(build.imageUrls?.length){
        this.buildImagePreviews.set([...build.imageUrls]);
      }
    }
  }

  private prefillIfEditMode(){
    const build = this.existingBuild();
    if(!build?.tags?.length) return;
    const ids = new Set(
      build.tags.map(t => t.id)
        .filter((id): id is number => id != null)
    );
    this.selectedTagIds.set(ids);
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

  private validateFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported format. Only JPEG and PNG are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" exceeds the 5 MB size limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
    }
    return null;
  }

  private validateFiles(files: File[]): string | null {
    for (const file of files) {
      const err = this.validateFile(file);
      if (err) return err;
    }
    return null;
  }

  onThumbnailSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.setThumbnail(file);
  }

  onThumbnailDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingThumbnail.set(true);
  }

  onThumbnailDragLeave(): void {
    this.isDraggingThumbnail.set(false);
  }

  onThumbnailDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingThumbnail.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (!file) return;
    this.setThumbnail(file);
  }

  private setThumbnail(file: File | null): void {
    if (!file) {
      this.thumbnailFile.set(null);
      this.thumbnailPreview.set(null);
      return;
    }
    const err = this.validateFile(file);
    if (err) { this.error.set(err); return; }
    this.error.set(null);
    this.thumbnailFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.thumbnailPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onBuildImagesSelected(event: Event): void {
    const incoming = Array.from((event.target as HTMLInputElement).files ?? []);
    for(let i = 0; i<incoming.length; i++){
    }
    this.addBuildImages(incoming);
    // Reset so the same file can be re-selected after removal
    (event.target as HTMLInputElement).value = '';
  }

  onImagesDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingImages.set(true);
  }

  onImagesDragLeave(): void {
    this.isDraggingImages.set(false);
  }

  onImagesDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingImages.set(false);
    const incoming = Array.from(event.dataTransfer?.files ?? []);
    this.addBuildImages(incoming);
  }

  private addBuildImages(incoming: File[]): void {
    this.error.set(null);

    const validationError = this.validateFiles(incoming);
    if (validationError) { this.error.set(validationError); return; }

    const existing = this.buildImageFiles();
    const combined = [...existing, ...incoming];

    if (combined.length > MAX_IMAGE_COUNT) {
      this.error.set(
        `You can upload a maximum of ${MAX_IMAGE_COUNT} images. ` +
        `You have ${existing.length} and tried to add ${incoming.length} more.`
      );
      return;
    }

    // Load previews only for newly added files, then append to existing previews
    const newPreviews: string[] = new Array(incoming.length);
    let loaded = 0;

    incoming.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[index] = e.target?.result as string;
        loaded++;
        if (loaded === incoming.length) {
          this.buildImageFiles.set(combined);
          this.buildImagePreviews.set([...this.buildImagePreviews(), ...newPreviews]);
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
    if(this.isEditMode){
      this.editCancelled.emit();
    }else {
      this.router.navigate(['/build']);
    }
  }

  submit(): void {
    if (!this.name().trim()) {
      this.error.set('Build name is required.');
      return;
    }

    if (!this.isEditMode && this.buildImageFiles().length === 0) {
      this.error.set('At least one build image is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    if (this.isEditMode) {
      this.submitUpdate();
    } else {
      this.submitCreate();
    }
  }

  private submitUpdate() {
    const build = this.existingBuild()!;

    this.buildController.updateBuild(build.id!, {
      name: this.name(),
      shortDescription: this.shortDescription(),
      description: this.description(),
      tagId: Array.from(this.selectedTagIds()),
    }).pipe(
      switchMap((updated) => {
        const buildName = updated.name!;
        const uploads = [];

        const thumbnail = this.thumbnailFile();
        if(thumbnail){
          uploads.push(this.uploadThumbnail(thumbnail, buildName));
        }
        const buildImages = this.buildImageFiles();
        if(buildImages.length > 0){
          uploads.push(this.uploadBuildImages(buildImages, buildName));
        }

        return uploads.length > 0 ? forkJoin(uploads) : of(null);
      }),
      switchMap(() => this.buildController.findBuildDetailsById(build.id!))
    ).subscribe({
      next: (refreshed) => {
        this.isSubmitting.set(false);
        this.editSaved.emit(refreshed);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.error?.bussinessErrorDescription ?? 'Failed To Update Build');
        this.isSubmitting.set(false);
      }
    });
  }

  private submitCreate(){

    const profile = this.authService.userProfile;
    const username: string = profile?.['preferred_username'] ?? '';

    // 1. Get internal user ID by username
    this.userController
      .findUserByName(username)
      .pipe(
        // 2. Create the build
        switchMap(() => {
          return this.buildController.createBuild(
            {
              name: this.name(),
              shortDescription: this.shortDescription(),
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
          this.error.set(err.error.businessErrorDescription || 'Failed to create build. Please try again.');
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
