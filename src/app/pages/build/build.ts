import {Component, inject} from '@angular/core';
import {BuildService} from '../../services/build';
import {BuildCard} from './build-card/build-card';

@Component({
  selector: 'app-build',
  imports: [
    BuildCard
  ],
  templateUrl: './build.html',
  styleUrl: './build.css',
})
export class Build {

  private service = inject(BuildService);

  builds = this.service.getAll();

}
