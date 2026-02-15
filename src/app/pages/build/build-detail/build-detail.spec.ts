import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildDetail } from './build-detail';

describe('BuildDetail', () => {
  let component: BuildDetail;
  let fixture: ComponentFixture<BuildDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
