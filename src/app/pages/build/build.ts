import {Component, inject, signal} from '@angular/core';
import {BuildService} from '../../services/build';
import {BuildCard} from './build-card/build-card';
import {BuildControllerService, BuildResponse} from '../../api/build-service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-build',
  imports: [
    BuildCard
  ],
  templateUrl: './build.html',
  styleUrl: './build.css',
})
export class Build {

  // private service = inject(BuildService);
  private controller = inject(BuildControllerService);
  private http = inject(HttpClient);

  // builds = this.service.getAll();
  // buildRes: BuildResponse[]= [];

  // test(){
  //   this.controller.findAll().subscribe({
  //       next: (response) => {
  //         this.buildRes = response.content ?? [];
  //       }
  //     })
  // }

  builds = signal<BuildResponse[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination state
  currentPage = signal(0);
  pageSize = signal(10);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadBuilds();
    console.log('Builds ', this.builds());
  }

  test(){
    this.http.get('http://localhost:8080/build/1').subscribe({
      next: (response) => {
        console.log('Build by ID: ', response);
      }
    });
    // this.controller.findById(1)
    //   .subscribe({
    //     next: (response) => {
    //       console.log('Build by ID: ', response);
    //     }
    //   });
  }

  loadBuilds(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.controller
      .findAll(this.currentPage(), this.pageSize(), 'name', 'asc')
      .subscribe({
        next: (page) => {
          console.log(page);
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
}
