import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstrategiaPlanComponent } from './estrategia-plan.component';

describe('EstrategiaPlanComponent', () => {
  let component: EstrategiaPlanComponent;
  let fixture: ComponentFixture<EstrategiaPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstrategiaPlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstrategiaPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
