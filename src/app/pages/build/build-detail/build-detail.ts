import {Component, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../../services/build';

@Component({
  selector: 'app-build-detail',
  imports: [],
  templateUrl: './build-detail.html',
  styleUrl: './build-detail.css',
})
export class BuildDetail {
  private route = inject(ActivatedRoute);
  private service = inject(BuildService);

  build = this.service.getById(
    Number(this.route.snapshot.paramMap.get('id'))
  );
}
