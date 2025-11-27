import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionPlanComponenteComponent } from './asignacion-plan-componente.component';

describe('AsignacionPlanComponenteComponent', () => {
  let component: AsignacionPlanComponenteComponent;
  let fixture: ComponentFixture<AsignacionPlanComponenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionPlanComponenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionPlanComponenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
