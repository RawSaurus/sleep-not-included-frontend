import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BuildDetailResponse, BuildResponse} from '../../../api/build-service';

@Component({
  selector: 'app-build-card',
  imports: [
    RouterLink
  ],
  templateUrl: './build-card.html',
  styleUrl: './build-card.css',
})
export class BuildCard {

  build = input.required<BuildDetailResponse>();

}
