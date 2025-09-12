import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvocatoriasGeneralComponent } from './convocatorias-general.component';

describe('ConvocatoriasGeneralComponent', () => {
  let component: ConvocatoriasGeneralComponent;
  let fixture: ComponentFixture<ConvocatoriasGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvocatoriasGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConvocatoriasGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
