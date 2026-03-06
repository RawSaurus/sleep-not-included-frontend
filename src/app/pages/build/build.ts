import {Component, computed, ElementRef, HostListener, inject, OnInit, signal} from '@angular/core';
import {BuildCard} from './build-card/build-card';
import {BuildControllerService, BuildDetailResponse, BuildResponse} from '../../api/build-service';
import {HttpClient} from '@angular/common/http';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../auth/auth.service';
import {TagControllerService, TagResponse} from '../../api/tag-service';
import {debounceTime, Subject} from 'rxjs';

type SortField = 'name' | 'likes' | 'createdAt';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-build',
  imports: [
    BuildCard,
    RouterLink
  ],
  templateUrl: './build.html',
  styleUrl: './build.css',
})
export class Build implements OnInit{

  private controller = inject(BuildControllerService);
  private http = inject(HttpClient);
  private tagController = inject(TagControllerService);
  private authService = inject(AuthService);
  private elementRef = inject(ElementRef);

  builds = signal<BuildDetailResponse[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  currentPage = signal(0);
  pageSize = signal(10);
  totalPages = signal(0);

  sortBy = signal<SortField>('createdAt');
  sortDirection = signal<SortDirection>('desc');

  searchName = signal('');
  availableTags = signal<TagResponse[]>([]);
  selectedTagIds = signal<Set<number>>(new Set());
  tagDropdownOpen = signal(false);

  private searchSubject = new Subject<void>();

  readonly sortOptions: { value: SortField; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'likes', label: 'Likes' },
    { value: 'createdAt', label: 'Date' },
  ];

  selectedTags = computed(() =>
    this.availableTags().filter(t => t.id != null && this.selectedTagIds().has(t.id!))
  );

  hasFilters = computed(() =>
    this.searchName().trim().length > 0 || this.selectedTagIds().size > 0
  );

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  ngOnInit(): void {
    this.loadTags();
    this.loadBuilds();

    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.currentPage.set(0);
      this.loadBuilds();
    });
  }

  private loadTags(): void {
    this.tagController.findAll(0, 100).subscribe({
      next: (page) => this.availableTags.set(page.content ?? []),
      error: () => console.error('Failed to load tags'),
    });
  }

  toggleTagDropdown(): void {
    this.tagDropdownOpen.update(v => !v);
  }

  toggleTag(tagId: number | undefined): void {
    if (tagId == null) return;
    const current = new Set(this.selectedTagIds());
    current.has(tagId) ? current.delete(tagId) : current.add(tagId);
    this.selectedTagIds.set(current);
    this.currentPage.set(0);
    this.loadBuilds();
  }

  isTagSelected(tagId: number | undefined): boolean {
    return tagId != null && this.selectedTagIds().has(tagId);
  }

  removeTag(tagId: number | undefined): void {
    if (tagId == null) return;
    const current = new Set(this.selectedTagIds());
    current.delete(tagId);
    this.selectedTagIds.set(current);
    this.currentPage.set(0);
    this.loadBuilds();
  }

  clearFilters(): void {
    this.searchName.set('');
    this.selectedTagIds.set(new Set());
    this.currentPage.set(0);
    this.loadBuilds();
  }

  // ── Name search ─────────────────────────────────────────

  onNameInput(value: string): void {
    this.searchName.set(value);
    this.searchSubject.next();
  }

  setSortBy(field: SortField): void {
    if (this.sortBy() === field) {
      // Toggle direction if same field clicked
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(0);
    this.loadBuilds();
  }

  loadBuilds(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const name = this.searchName().trim() || undefined;
    const tagIds = [...this.selectedTagIds()];

    if (!name && tagIds.length === 0) {
      this.controller
        .findAllTest(this.currentPage(), this.pageSize(), this.sortBy(), this.sortDirection())
        .subscribe({
          next: (page) => {
            this.builds.set(page.content ?? []);
            this.totalPages.set(page.totalPages ?? 0);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to load builds. Please try again.');
            this.isLoading.set(false);
            console.error(err);
          },
        });
    } else {
      this.controller
        .filterBuilds(
          name,
          tagIds.length > 0 ? tagIds : undefined,
          this.currentPage(),
          this.pageSize(),
          this.sortBy(),
          this.sortDirection()
        )
        .subscribe({
          next: (page) => {
            this.builds.set(page.content ?? []);
            this.totalPages.set(page.totalPages ?? 0);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to load builds. Please try again.');
            this.isLoading.set(false);
            console.error(err);
          },
        });
    }
    // this.isLoading.set(true);
    // this.error.set(null);
    //
    // this.controller
    //   .findAllTest(this.currentPage(), this.pageSize(), this.sortBy(), this.sortDirection())
    //   .subscribe({
    //     next: (page) => {
    //       // console.log(page);
    //       this.builds.set(page.content ?? []);
    //       this.totalPages.set(page.totalPages ?? 0);
    //       this.isLoading.set(false);
    //     },
    //     error: (err) => {
    //       this.error.set('Failed to load builds. Please try again.');
    //       this.isLoading.set(false);
    //       console.error(err);
    //     },
    //   });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
      this.loadBuilds();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadBuilds();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.tagDropdownOpen.set(false);
    }
  }
}
