import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguimientoEstrategiaComponent } from './seguimiento-estrategia.component';

describe('SeguimientoEstrategiaComponent', () => {
  let component: SeguimientoEstrategiaComponent;
  let fixture: ComponentFixture<SeguimientoEstrategiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeguimientoEstrategiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeguimientoEstrategiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
