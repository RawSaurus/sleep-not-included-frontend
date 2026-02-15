import { TestBed } from '@angular/core/testing';

import { Build } from './build';

describe('Build', () => {
  let service: Build;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Build);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
