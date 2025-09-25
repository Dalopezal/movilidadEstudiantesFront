import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionEntregableComponent } from './gestion-entregable.component';


describe('GestionEntregableComponent', () => {
  let component: GestionEntregableComponent;
  let fixture: ComponentFixture<GestionEntregableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionEntregableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionEntregableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
