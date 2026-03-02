import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildCreate } from './build-create';

describe('BuildCreate', () => {
  let component: BuildCreate;
  let fixture: ComponentFixture<BuildCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
