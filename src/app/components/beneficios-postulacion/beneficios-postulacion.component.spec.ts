import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiosPostulacionComponent } from './beneficios-postulacion.component';

describe('BeneficiosPostulacionComponent', () => {
  let component: BeneficiosPostulacionComponent;
  let fixture: ComponentFixture<BeneficiosPostulacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiosPostulacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiosPostulacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
