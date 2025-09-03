import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CondicionConvocatoriaComponent } from './condicion-convocatoria.component';

describe('CondicionConvocatoriaComponent', () => {
  let component: CondicionConvocatoriaComponent;
  let fixture: ComponentFixture<CondicionConvocatoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CondicionConvocatoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CondicionConvocatoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
