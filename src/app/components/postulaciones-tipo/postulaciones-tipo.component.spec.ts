import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostulcionesEntrantesComponent } from './postulaciones-tipo.component';

describe('ConvocatoriasGeneralComponent', () => {
  let component: PostulcionesEntrantesComponent;
  let fixture: ComponentFixture<PostulcionesEntrantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostulcionesEntrantesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostulcionesEntrantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
