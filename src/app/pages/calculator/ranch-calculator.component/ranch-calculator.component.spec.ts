import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RanchCalculatorComponent } from './ranch-calculator.component';

describe('RanchCalculatorComponent', () => {
  let component: RanchCalculatorComponent;
  let fixture: ComponentFixture<RanchCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RanchCalculatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RanchCalculatorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
