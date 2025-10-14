import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionCondicionComponent } from './gestion-condicion.component';


describe('GestionCondicionComponent', () => {
  let component: GestionCondicionComponent;
  let fixture: ComponentFixture<GestionCondicionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionCondicionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionCondicionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
