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
import {CommentItem} from './comment-item/comment-item';

@Component({
  selector: 'app-comment-section',
  imports: [FormsModule, CommentItem],
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
    this.userController.findUserByKeycloakId(profile['sub']).subscribe({
      next: (user) => this.currentUserId.set(user.id ?? null),
      error: () => {},
    });
  }

  loadComments(): void {
    if (this.isLoadingComments() || !this.hasMoreComments()) return;
    this.isLoadingComments.set(true);

    this.commentController
      .findAllByBuild(this.buildId, this.currentPage(), this.pageSize, 'createdAt', 'desc')
      .subscribe({
        next: (page) => {
          this.comments.update(prev => [...prev, ...(page.content ?? [])]);
          const totalPages = page.totalPages ?? 1;
          this.hasMoreComments.set(this.currentPage() + 1 < totalPages);
          this.currentPage.update(p => p + 1);
          this.isLoadingComments.set(false);
        },
        error: () => this.isLoadingComments.set(false),
      });
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      this.loadComments();
    }
  }

  submitComment(): void {
    const body = this.newCommentBody().trim();
    if (!body) return;

    this.isSubmitting.set(true);
    this.commentController.createComment(this.buildId, { body }).subscribe({
      next: (comment) => {
        this.comments.update(prev => [comment, ...prev]);
        this.newCommentBody.set('');
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  onCommentDeleted(deletedId: number): void {
    this.comments.update(prev => prev.filter(c => c.id !== deletedId));
  }
}
