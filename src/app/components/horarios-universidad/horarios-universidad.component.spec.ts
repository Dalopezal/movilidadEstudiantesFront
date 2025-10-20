import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorariosUniversidadComponent } from './horarios-universidad.component';

describe('HorariosUniversidadComponent', () => {
  let component: HorariosUniversidadComponent;
  let fixture: ComponentFixture<HorariosUniversidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosUniversidadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorariosUniversidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
