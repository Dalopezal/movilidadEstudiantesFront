import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActividadesSeguimientoComponent } from './actividades-seguimiento.component';

describe('ActividadesSeguimientoComponent', () => {
  let component: ActividadesSeguimientoComponent;
  let fixture: ComponentFixture<ActividadesSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActividadesSeguimientoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActividadesSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
