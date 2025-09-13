import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostulacionesDetalleComponent } from './postulaciones-detalle.component';

describe('PostulacionesDetalleComponent', () => {
  let component: PostulacionesDetalleComponent;
  let fixture: ComponentFixture<PostulacionesDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostulacionesDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostulacionesDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
