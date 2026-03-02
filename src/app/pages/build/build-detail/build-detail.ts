import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../../services/build';
import {BuildControllerService, BuildResponse} from '../../../api/build-service';
import {BuildEnrichmentService} from '../../../services/build-enrichment.service';
import {BuildEnrichedModel} from '../../../models/build-enriched.model';
import {switchMap} from 'rxjs';

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
  private enrichment = inject(BuildEnrichmentService);

  build = signal<BuildEnrichedModel | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.buildController.findById(id)
      .pipe(switchMap((build) => this.enrichment.enrichOne(build)))
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
