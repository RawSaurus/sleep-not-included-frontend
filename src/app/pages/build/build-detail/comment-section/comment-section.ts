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

  expandedResponses = signal<Set<number>>(new Set());
  responses = signal<Map<number, CommentResponse[]>>(new Map());
  loadingResponses = signal<Set<number>>(new Set());

  activeReplyId = signal<number | null>(null);
  replyDrafts = signal<Map<number, string>>(new Map());
  replySubmitting = signal<Set<number>>(new Set());

  editingCommentId = signal<number | null>(null);
  editBody = signal('');
  editSubmitting = signal(false);

  deletingCommentId = signal<number | null>(null);

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

  isOwner(comment: CommentResponse): boolean {
    const uid = this.currentUserId();
    if (uid == null) return false;
    return comment.userId === uid.toString();
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
      .createComment(this.buildId, { body })
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

  private setLoadingResponse(id: number, loading: boolean): void {
    const set = new Set(this.loadingResponses());
    loading ? set.add(id) : set.delete(id);
    this.loadingResponses.set(set);
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

  toggleReplyBox(commentId: number): void {
    this.activeReplyId.set(this.activeReplyId() === commentId ? null : commentId);
    if (!this.replyDrafts().has(commentId)) {
      const map = new Map(this.replyDrafts());
      map.set(commentId, '');
      this.replyDrafts.set(map);
    }
  }

  getReplyDraft(commentId: number): string {
    return this.replyDrafts().get(commentId) ?? '';
  }

  setReplyDraft(commentId: number, value: string): void {
    const map = new Map(this.replyDrafts());
    map.set(commentId, value);
    this.replyDrafts.set(map);
  }

  isReplySubmitting(commentId: number): boolean {
    return this.replySubmitting().has(commentId);
  }

  submitReply(parentComment: CommentResponse): void {
    const id = parentComment.id!;
    const body = this.getReplyDraft(id).trim();
    if (!body) return;

    const submitting = new Set(this.replySubmitting());
    submitting.add(id);
    this.replySubmitting.set(submitting);

    this.commentController.respond(id, { body }).subscribe({
      next: (response) => {
        // Append to responses list (lazy-create if needed)
        const map = new Map(this.responses());
        map.set(id, [...(map.get(id) ?? []), response]);
        this.responses.set(map);

        // Expand responses section
        const expanded = new Set(this.expandedResponses());
        expanded.add(id);
        this.expandedResponses.set(expanded);

        // Increment counter on parent comment
        this.comments.update((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, numOfResponses: (c.numOfResponses ?? 0) + 1 } : c
          )
        );

        // Clean up
        this.setReplyDraft(id, '');
        this.activeReplyId.set(null);
        const done = new Set(this.replySubmitting());
        done.delete(id);
        this.replySubmitting.set(done);
      },
      error: () => {
        const done = new Set(this.replySubmitting());
        done.delete(id);
        this.replySubmitting.set(done);
      },
    });
  }

  // ── Edit ──────────────────────────────────────────────

  startEdit(comment: CommentResponse): void {
    this.editingCommentId.set(comment.id!);
    this.editBody.set(comment.body ?? '');
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editBody.set('');
  }

  submitEdit(comment: CommentResponse): void {
    const body = this.editBody().trim();
    if (!body || this.editSubmitting()) return;

    this.editSubmitting.set(true);
    this.commentController.updateComment(this.buildId, comment.id!, { body }).subscribe({
      next: (updated) => {
        this.comments.update((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, body: updated.body } : c))
        );
        this.editingCommentId.set(null);
        this.editBody.set('');
        this.editSubmitting.set(false);
      },
      error: () => this.editSubmitting.set(false),
    });
  }

  // ── Delete ────────────────────────────────────────────

  confirmDelete(commentId: number): void {
    this.deletingCommentId.set(commentId);
  }

  cancelDelete(): void {
    this.deletingCommentId.set(null);
  }

  submitDelete(commentId: number): void {
    this.commentController.deleteComment(commentId).subscribe({
      next: () => {
        this.comments.update((prev) => prev.filter((c) => c.id !== commentId));
        this.deletingCommentId.set(null);
      },
      error: () => this.deletingCommentId.set(null),
    });
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
