import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, forkJoin, map, Observable, of} from 'rxjs';
import {TagResponse} from '../api/tag-service';
import {BuildResponse} from '../api/build-service';
import {BuildEnrichedModel} from '../models/build-enriched.model';

@Injectable({
  providedIn: 'root'
})
export class BuildEnrichmentService{
  private http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8080';

  /** Fetch tags for a single build via the new endpoint */
  private fetchTags(buildId: number): Observable<TagResponse[]> {
    return this.http
      .get<TagResponse[]>(`${this.BASE}/build/${buildId}/tags`)
      .pipe(catchError(() => of([])));
  }

  /** Fetch thumbnail blob and convert to object URL */
  private fetchThumbnail(buildName: string): Observable<string | null> {
    return this.http
      .get(`${this.BASE}/image/download/${buildName}?type=BUILD_THUMBNAIL`, {
        responseType: 'blob',
      })
      .pipe(
        map((blob) => URL.createObjectURL(blob)),
        catchError(() => of(null))
      );
  }

  /** Fetch build image blobs and convert to object URLs */
  private fetchBuildImages(buildName: string): Observable<string[]> {
    return this.http
      .get(`${this.BASE}/image/download/build-images/${buildName}`, {
        responseType: 'blob',
      })
      .pipe(
        // Backend returns a single multipart blob — wrap in array
        map((blob) => [URL.createObjectURL(blob)]),
        catchError(() => of([]))
      );
  }

  /** Enrich a single build with tags + images */
  enrichOne(build: BuildResponse): Observable<BuildEnrichedModel> {
    return forkJoin({
      tags: this.fetchTags(build.id!),
      thumbnailUrl: this.fetchThumbnail(build.name!),
      buildImageUrls: this.fetchBuildImages(build.name!),
    }).pipe(
      map(({ tags, thumbnailUrl, buildImageUrls }) => ({
        ...build,
        tags,
        thumbnailUrl,
        buildImageUrls,
      }))
    );
  }

  /** Enrich a page of builds — runs all enrichments in parallel */
  enrichAll(builds: BuildResponse[]): Observable<BuildEnrichedModel[]> {
    if (builds.length === 0) return of([]);
    return forkJoin(builds.map((b) => this.enrichOne(b)));
  }
}
