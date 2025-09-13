import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiposPostulacionesComponent } from './tipos-postulaciones.component';


describe('TiposConvocatoriaComponent', () => {
  let component: TiposPostulacionesComponent;
  let fixture: ComponentFixture<TiposPostulacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposPostulacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiposPostulacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
