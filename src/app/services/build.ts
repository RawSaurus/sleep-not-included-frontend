import { Injectable } from '@angular/core';
import { type BuildModel } from '../models/build.model'

@Injectable({
  providedIn: 'root',
})
export class BuildService {

  private builds: BuildModel[] = [
    {
      id: 1,
      name: 'Efficient Oxygen Farm',
      likes: 245,
      description: 'Compact oxygen production system for early colony.',
      image: 'https://via.placeholder.com/600x338',
      tags: ['SPOM', 'Oxygen'],
      dlc: 'Base Game',
      createdAt: '2026-02-01'
    },
    {
      id: 2,
      name: 'Industrial Power Block',
      likes: 198,
      description: 'Optimized industrial power grid setup.',
      image: 'https://via.placeholder.com/600x338',
      tags: ['Power', 'Automation'],
      dlc: 'Spaced Out',
      createdAt: '2026-02-05'
    }
  ];

  getAll() {
    return this.builds;
  }

  getById(id: number){
    return this.builds.find(b => b.id === id);
  }

}
