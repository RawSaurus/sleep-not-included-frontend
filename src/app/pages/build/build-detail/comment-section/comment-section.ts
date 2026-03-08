import {
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {AuthService} from '../../../../auth/auth.service';
import {CommentControllerService, CommentResponse} from '../../../../api/comment-service';
import {UserControllerService} from '../../../../api/user-service';

@Component({
  selector: 'app-comment-section',
  imports: [FormsModule],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.css',
})
export class CommentSection implements OnInit {
  @Input() buildId!: number;
  @ViewChild('commentListRef') commentListRef!: ElementRef<HTMLElement>;

  private authService = inject(AuthService);
  private commentController = inject(CommentControllerService);
  private userController = inject(UserControllerService);

  comments = signal<CommentResponse[]>([]);
  isLoadingComments = signal(false);
  hasMoreComments = signal(true);
  currentPage = signal(0);
  readonly pageSize = 10;

  newCommentBody = signal('');
  isSubmitting = signal(false);

  currentUserId = signal<number | null>(null);

  // Track which comment's responses are expanded
  expandedResponses = signal<Set<number>>(new Set());
  // Map commentId -> responses list
  responses = signal<Map<number, CommentResponse[]>>(new Map());
  loadingResponses = signal<Set<number>>(new Set());

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  ngOnInit(): void {
    this.loadComments();
    if (this.isLoggedIn) {
      this.resolveCurrentUser();
    }
  }

  private resolveCurrentUser(): void {
    const profile = this.authService.userProfile;
    if (!profile) return;
    const keycloakId: string = profile['sub'];
    this.userController.findUserByKeycloakId(keycloakId).subscribe({
      next: (user) => this.currentUserId.set(user.id ?? null),
      error: () => {},
    });
  }

  loadComments(): void {
    if (this.isLoadingComments() || !this.hasMoreComments()) return;
    this.isLoadingComments.set(true);

    this.commentController
      .findAllByBuild(
        this.buildId,
        this.currentPage(),
        this.pageSize,
        'createdAt',
        'desc'
      )
      .subscribe({
        next: (page) => {
          const newComments = page.content ?? [];
          this.comments.update((prev) => [...prev, ...newComments]);
          const totalPages = page.totalPages ?? 1;
          this.hasMoreComments.set(this.currentPage() + 1 < totalPages);
          this.currentPage.update((p) => p + 1);
          this.isLoadingComments.set(false);
        },
        error: () => this.isLoadingComments.set(false),
      });
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) {
      this.loadComments();
    }
  }

  submitComment(): void {
    const body = this.newCommentBody().trim();
    const userId = this.currentUserId();
    if (!body || !userId) return;

    this.isSubmitting.set(true);
    this.commentController
      .createComment(userId, this.buildId, { body })
      .subscribe({
        next: (comment) => {
          this.comments.update((prev) => [comment, ...prev]);
          this.newCommentBody.set('');
          this.isSubmitting.set(false);
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  toggleResponses(comment: CommentResponse): void {
    const id = comment.id!;
    const expanded = new Set(this.expandedResponses());

    if (expanded.has(id)) {
      expanded.delete(id);
      this.expandedResponses.set(expanded);
      return;
    }

    expanded.add(id);
    this.expandedResponses.set(expanded);

    // Load responses if not yet loaded
    if (!this.responses().has(id)) {
      const loading = new Set(this.loadingResponses());
      loading.add(id);
      this.loadingResponses.set(loading);

      this.commentController.findAllResponses(id, 0, 50, 'createdAt', 'asc').subscribe({
        next: (page) => {
          const map = new Map(this.responses());
          map.set(id, page.content ?? []);
          this.responses.set(map);

          const l = new Set(this.loadingResponses());
          l.delete(id);
          this.loadingResponses.set(l);
        },
        error: () => {
          const l = new Set(this.loadingResponses());
          l.delete(id);
          this.loadingResponses.set(l);
        },
      });
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedResponses().has(id);
  }

  getResponses(id: number): CommentResponse[] {
    return this.responses().get(id) ?? [];
  }

  isLoadingResponse(id: number): boolean {
    return this.loadingResponses().has(id);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
