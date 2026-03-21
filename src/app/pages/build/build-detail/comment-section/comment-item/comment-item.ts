import {Component, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
import {CommentControllerService, CommentResponse} from '../../../../../api/comment-service';
import {AuthService} from '../../../../../auth/auth.service';

@Component({
  selector: 'app-comment-item',
  imports: [],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem implements OnInit{
  @Input() comment!: CommentResponse;
  @Input() buildId!: number;
  @Input() currentUserId: number | null = null;
  @Input() depth: number = 0;

  /** Emits this comment's id when it has been successfully deleted */
  @Output() deleted = new EventEmitter<number>();

  private authService = inject(AuthService);
  private commentController = inject(CommentControllerService);

  // Local mutable copy so we can patch body / numOfResponses without full reload
  body = signal('');
  numOfResponses = signal(0);
  likesCount = signal(0);
  isLiked = signal(false)

  // Responses
  responses = signal<CommentResponse[]>([]);
  isExpanded = signal(false);
  isLoadingResponses = signal(false);
  responsesLoaded = signal(false);

  // Reply
  isReplying = signal(false);
  replyBody = signal('');
  isSubmittingReply = signal(false);

  // Edit
  isEditing = signal(false);
  editBody = signal('');
  isSubmittingEdit = signal(false);

  // Delete confirm
  isConfirmingDelete = signal(false);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  get isOwner(): boolean {
    if (this.currentUserId == null) return false;
    return this.comment.userId === this.currentUserId.toString();
  }

  /** Stop recursing at a reasonable depth to avoid UI getting too narrow */
  get canReply(): boolean {
    return this.isLoggedIn && this.depth < 6;
  }

  ngOnInit(): void {
    this.body.set(this.comment.body ?? '');
    this.numOfResponses.set(this.comment.numOfResponses ?? 0);
    this.likesCount.set(this.comment.likes ?? 0);
    this.isLiked.set(this.comment.isLiked ?? false);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  // ── Like ──────────────────────────────────────────────

  toggleLike(): void {
    if (!this.isLoggedIn) return;

    const previousLiked = this.isLiked();
    const previousCount = this.likesCount();

    // Optimistic update
    this.isLiked.set(!previousLiked);
    this.likesCount.set(previousCount + (previousLiked ? -1 : 1));

    this.commentController.likeComment(this.comment.id!).subscribe({
      error: () => {
        // Revert on failure
        this.isLiked.set(previousLiked);
        this.likesCount.set(previousCount);
      },
    });
  }

  // ── Expand / Load responses ───────────────────────────

  toggleResponses(): void {
    if (this.isExpanded()) {
      this.isExpanded.set(false);
      return;
    }
    this.isExpanded.set(true);
    if (!this.responsesLoaded()) {
      this.loadResponses();
    }
  }

  private loadResponses(): void {
    this.isLoadingResponses.set(true);
    this.commentController
      .findAllResponses(this.comment.id!, 0, 50, 'createdAt', 'asc')
      .subscribe({
        next: (page) => {
          this.responses.set(page.content ?? []);
          this.responsesLoaded.set(true);
          this.isLoadingResponses.set(false);
        },
        error: () => this.isLoadingResponses.set(false),
      });
  }

  // ── Reply ─────────────────────────────────────────────

  toggleReply(): void {
    this.isReplying.update(v => !v);
    if (!this.isReplying()) this.replyBody.set('');
  }

  submitReply(): void {
    const body = this.replyBody().trim();
    if (!body) return;

    this.isSubmittingReply.set(true);
    this.commentController.respond(this.comment.id!, { body }).subscribe({
      next: (newResponse) => {
        // Add to responses list and ensure expanded
        this.responses.update(prev => [...prev, newResponse]);
        this.responsesLoaded.set(true);
        this.isExpanded.set(true);
        this.numOfResponses.update(n => n + 1);

        this.replyBody.set('');
        this.isReplying.set(false);
        this.isSubmittingReply.set(false);
      },
      error: () => this.isSubmittingReply.set(false),
    });
  }

  // ── Edit ──────────────────────────────────────────────

  startEdit(): void {
    this.editBody.set(this.body());
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  submitEdit(): void {
    const body = this.editBody().trim();
    if (!body || this.isSubmittingEdit()) return;

    this.isSubmittingEdit.set(true);
    this.commentController
      .updateComment(this.buildId, this.comment.id!, { body })
      .subscribe({
        next: (updated) => {
          this.body.set(updated.body ?? body);
          this.isEditing.set(false);
          this.isSubmittingEdit.set(false);
        },
        error: () => this.isSubmittingEdit.set(false),
      });
  }

  // ── Delete ────────────────────────────────────────────

  confirmDelete(): void {
    this.isConfirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.isConfirmingDelete.set(false);
  }

  submitDelete(): void {
    this.commentController.deleteComment(this.comment.id!).subscribe({
      next: () => this.deleted.emit(this.comment.id!),
      error: () => this.isConfirmingDelete.set(false),
    });
  }

  // ── Called when a direct child response is deleted ───

  onChildDeleted(deletedId: number): void {
    this.responses.update(prev => prev.filter(r => r.id !== deletedId));
    this.numOfResponses.update(n => Math.max(n - 1, 0));
  }
}
