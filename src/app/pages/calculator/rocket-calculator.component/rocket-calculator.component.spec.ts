import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RocketCalculatorComponent } from './rocket-calculator.component';

describe('RocketCalculatorComponent', () => {
  let component: RocketCalculatorComponent;
  let fixture: ComponentFixture<RocketCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RocketCalculatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RocketCalculatorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
