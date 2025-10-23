import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionEstrategiaComponent } from './asignacion-estrategia.component';

describe('AsignacionEstrategiaComponent', () => {
  let component: AsignacionEstrategiaComponent;
  let fixture: ComponentFixture<AsignacionEstrategiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionEstrategiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignacionEstrategiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
