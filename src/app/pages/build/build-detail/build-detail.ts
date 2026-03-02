import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../../services/build';
import {BuildControllerService, BuildResponse} from '../../../api/build-service';

@Component({
  selector: 'app-build-detail',
  imports: [],
  templateUrl: './build-detail.html',
  styleUrl: './build-detail.css',
})
export class BuildDetail {
  // private route = inject(ActivatedRoute);
  // private service = inject(BuildService);
  //
  // build = this.service.getById(
  //   Number(this.route.snapshot.paramMap.get('id'))
  // );
  private route = inject(ActivatedRoute);
  private buildController = inject(BuildControllerService);

  build = signal<BuildResponse | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.buildController.findById(id)
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
}
