import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Build } from './build';

describe('Build', () => {
  let component: Build;
  let fixture: ComponentFixture<Build>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Build]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Build);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
