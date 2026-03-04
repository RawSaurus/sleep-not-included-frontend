import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {NgClass, SlicePipe} from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UserControllerService, UserResponse, UserRequest } from '../../api/user-service';
import { BuildControllerService, BuildResponse } from '../../api/build-service';
import { ImageControllerService } from '../../api/image-service';
import { forkJoin } from 'rxjs';
import { BuildCard } from '../build/build-card/build-card';

type ProfileTab = 'builds' | 'liked';

@Component({
  selector: 'app-profile.component',
  imports: [
    BuildCard,
    NgClass,
    SlicePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit{
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private authService    = inject(AuthService);
  private userController = inject(UserControllerService);
  private buildController = inject(BuildControllerService);
  private imageController = inject(ImageControllerService);

  // ── Viewed user ─────────────────────────────────────
  profileUser   = signal<UserResponse | null>(null);
  profilePicUrl = signal<string | null>(null);

  // ── Builds ──────────────────────────────────────────
  userBuilds  = signal<BuildResponse[]>([]);
  likedBuilds = signal<BuildResponse[]>([]);
  activeTab   = signal<ProfileTab>('builds');

  // Pagination
  buildsPage      = signal(0);
  likedPage       = signal(0);
  buildsTotalPages = signal(0);
  likedTotalPages  = signal(0);
  pageSize = 9;

  // ── UI state ─────────────────────────────────────────
  isLoading      = signal(true);
  isLoadingBuilds = signal(false);
  error          = signal<string | null>(null);
  editMode       = signal(false);
  isSaving       = signal(false);
  saveError      = signal<string | null>(null);
  saveSuccess    = signal(false);

  // ── Edit form ────────────────────────────────────────
  editUsername = signal('');
  editEmail    = signal('');
  editPassword = signal('');
  newAvatarFile = signal<File | null>(null);
  newAvatarPreview = signal<string | null>(null);

  // ── Derived ──────────────────────────────────────────
  isOwnProfile = computed(() => {
    const profile = this.profileUser();
    const claims  = this.authService.userProfile;
    if (!profile || !claims) return false;
    return profile.keycloakId === claims['sub'];
  });

  currentBuilds = computed(() =>
    this.activeTab() === 'builds' ? this.userBuilds() : this.likedBuilds()
  );

  currentTotalPages = computed(() =>
    this.activeTab() === 'builds' ? this.buildsTotalPages() : this.likedTotalPages()
  );

  currentPage = computed(() =>
    this.activeTab() === 'builds' ? this.buildsPage() : this.likedPage()
  );

  // ─────────────────────────────────────────────────────
  ngOnInit(): void {
    // this.route.paramMap.subscribe(params => {
    //   const userId = Number(params.get('id'));
    //   if (isNaN(userId)) {
    //     this.error.set('Invalid user ID.');
    //     this.isLoading.set(false);
    //     return;
    //   }
    //   this.loadProfile(userId);
    // });
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam) {
        // Viewing someone else's profile by numeric ID
        const userId = Number(idParam);
        if (isNaN(userId)) {
          this.error.set('Invalid user ID.');
          this.isLoading.set(false);
          return;
        }
        this.loadProfileById(userId);
      } else {
        // No ID — load the currently logged-in user
        const claims = this.authService.userProfile;
        if (!claims) {
          this.error.set('You must be logged in to view your profile.');
          this.isLoading.set(false);
          return;
        }
        const username: string = claims['preferred_username'];
        this.loadProfileByUsername(username);
      }
    });
  }

  private loadProfileById(userId: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.userController.findUser(userId).subscribe({
      next: (user) => { this.profileUser.set(user); this.isLoading.set(false); this.loadBuildsTab(); },
      error: () => { this.error.set('User not found.'); this.isLoading.set(false); }
    });
  }

  private loadProfileByUsername(username: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.userController.findUserByName(username).subscribe({
      next: (user) => {
        this.profileUser.set(user);
        this.isLoading.set(false);
        this.loadBuildsTab();
      },
      error: () => {
        this.error.set('Could not load your profile.');
        this.isLoading.set(false);
      }
    });
  }

  private loadProfile(userId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userController.findUser(userId).subscribe({
      next: (user) => {
        this.profileUser.set(user);
        this.isLoading.set(false);
        this.loadBuildsTab();
        this.loadProfilePicture(user.username ?? '');
      },
      error: () => {
        this.error.set('User not found.');
        this.isLoading.set(false);
      }
    });
  }

  private loadProfilePicture(username: string): void {
    // Profile pictures are stored under the user's username as PROFILE_PIC type
    // imageController.findByName not available - construct URL directly if needed
    // Using a placeholder approach; swap with real endpoint if exposed
    this.profilePicUrl.set(null);
  }

  loadBuildsTab(): void {
    const user = this.profileUser();
    if (!user?.id) return;

    this.isLoadingBuilds.set(true);

    if (this.activeTab() === 'builds') {
      this.buildController
        .findAllFromUser(user.id, this.buildsPage(), this.pageSize)
        .subscribe({
          next: (page) => {
            this.userBuilds.set(page.content ?? []);
            this.buildsTotalPages.set(page.totalPages ?? 0);
            this.isLoadingBuilds.set(false);
          },
          error: () => {
            this.error.set('Failed to load builds.');
            this.isLoadingBuilds.set(false);
          }
        });
    } else {
      this.buildController
        .findAllLikedBuilds(user.id, this.likedPage(), this.pageSize)
        .subscribe({
          next: (page) => {
            this.likedBuilds.set(page.content ?? []);
            this.likedTotalPages.set(page.totalPages ?? 0);
            this.isLoadingBuilds.set(false);
          },
          error: () => {
            this.error.set('Failed to load liked builds.');
            this.isLoadingBuilds.set(false);
          }
        });
    }
  }

  switchTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    this.loadBuildsTab();
  }

  nextPage(): void {
    if (this.activeTab() === 'builds') {
      if (this.buildsPage() < this.buildsTotalPages() - 1) {
        this.buildsPage.update(p => p + 1);
        this.loadBuildsTab();
      }
    } else {
      if (this.likedPage() < this.likedTotalPages() - 1) {
        this.likedPage.update(p => p + 1);
        this.loadBuildsTab();
      }
    }
  }

  prevPage(): void {
    if (this.activeTab() === 'builds') {
      if (this.buildsPage() > 0) {
        this.buildsPage.update(p => p - 1);
        this.loadBuildsTab();
      }
    } else {
      if (this.likedPage() > 0) {
        this.likedPage.update(p => p - 1);
        this.loadBuildsTab();
      }
    }
  }

  // ── Edit mode ────────────────────────────────────────
  openEditMode(): void {
    const user = this.profileUser();
    if (!user) return;
    this.editUsername.set(user.username ?? '');
    this.editEmail.set(user.email ?? '');
    this.editPassword.set('');
    this.newAvatarFile.set(null);
    this.newAvatarPreview.set(null);
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.editMode.set(true);
  }

  closeEditMode(): void {
    this.editMode.set(false);
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.newAvatarFile.set(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.newAvatarPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.newAvatarPreview.set(null);
    }
  }

  saveProfile(): void {
    const user = this.profileUser();
    if (!user?.id) return;

    const username = this.editUsername().trim();
    const password = this.editPassword().trim();

    if (!username) {
      this.saveError.set('Username cannot be empty.');
      return;
    }
    if (!password) {
      this.saveError.set('Password is required to save changes.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    const request: UserRequest = {
      username,
      email: this.editEmail().trim() || undefined,
      password,
    };

    const updateUser$ = this.userController.updateUser(user.id, request);
    const avatarFile  = this.newAvatarFile();

    if (avatarFile) {
      const updateAvatar$ = this.imageController.updateImage('PROFILE_PIC', username, avatarFile);
      forkJoin([updateUser$, updateAvatar$]).subscribe({
        next: ([updatedUser]) => this.onSaveSuccess(updatedUser),
        error: (err) => this.onSaveError(err),
      });
    } else {
      updateUser$.subscribe({
        next: (updatedUser) => this.onSaveSuccess(updatedUser),
        error: (err) => this.onSaveError(err),
      });
    }
  }

  private onSaveSuccess(updated: UserResponse): void {
    this.profileUser.set(updated);
    this.isSaving.set(false);
    this.saveSuccess.set(true);
    this.editPassword.set('');
    setTimeout(() => {
      this.saveSuccess.set(false);
      this.editMode.set(false);
    }, 1500);
  }

  private onSaveError(err: unknown): void {
    console.error(err);
    this.saveError.set('Failed to update profile. Please try again.');
    this.isSaving.set(false);
  }
}
