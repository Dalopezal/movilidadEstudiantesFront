import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficioConvocatoriaComponent } from './beneficio-convocatoria.component';

describe('BeneficioConvocatoriaComponent', () => {
  let component: BeneficioConvocatoriaComponent;
  let fixture: ComponentFixture<BeneficioConvocatoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficioConvocatoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficioConvocatoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
