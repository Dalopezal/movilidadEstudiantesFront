import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminConvocatoriaComponent } from './admin-convocatoria.component';

describe('AdminConvocatoriaComponent', () => {
  let component: AdminConvocatoriaComponent;
  let fixture: ComponentFixture<AdminConvocatoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminConvocatoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminConvocatoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
