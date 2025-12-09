import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaneacionVsEjecucionComponent } from './planeacion-vs-ejecucion.component';

describe('PlaneacionVsEjecucionComponent', () => {
  let component: PlaneacionVsEjecucionComponent;
  let fixture: ComponentFixture<PlaneacionVsEjecucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaneacionVsEjecucionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaneacionVsEjecucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
