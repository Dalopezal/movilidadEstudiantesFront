import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinanciacionExternaComponent } from './financiacion-externa.component';


describe('FinanciacionExternaComponent', () => {
  let component: FinanciacionExternaComponent;
  let fixture: ComponentFixture<FinanciacionExternaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanciacionExternaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanciacionExternaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
