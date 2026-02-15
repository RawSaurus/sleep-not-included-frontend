import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildCard } from './build-card';

describe('BuildCard', () => {
  let component: BuildCard;
  let fixture: ComponentFixture<BuildCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
