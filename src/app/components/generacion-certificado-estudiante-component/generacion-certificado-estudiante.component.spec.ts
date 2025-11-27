import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneracionCertificadoEstudianteComponent } from './generacion-certificado-estudiante.component';


describe('GeneracionCertificadoEstudianteComponent', () => {
  let component: GeneracionCertificadoEstudianteComponent;
  let fixture: ComponentFixture<GeneracionCertificadoEstudianteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneracionCertificadoEstudianteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneracionCertificadoEstudianteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
