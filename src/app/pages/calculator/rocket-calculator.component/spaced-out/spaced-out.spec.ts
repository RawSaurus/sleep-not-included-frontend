import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpacedOut } from './spaced-out';

describe('SpacedOut', () => {
  let component: SpacedOut;
  let fixture: ComponentFixture<SpacedOut>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpacedOut]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpacedOut);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
