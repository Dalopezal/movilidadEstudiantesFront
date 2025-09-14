import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiposConvocatoriaComponent } from './tipos-convocatoria.component';


describe('TiposConvocatoriaComponent', () => {
  let component: TiposConvocatoriaComponent;
  let fixture: ComponentFixture<TiposConvocatoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposConvocatoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiposConvocatoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
