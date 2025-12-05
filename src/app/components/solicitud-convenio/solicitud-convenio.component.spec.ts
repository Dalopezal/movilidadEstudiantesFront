import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudConvenioComponent } from './solicitud-convenio.component';

describe('SolicitudConvenioComponent', () => {
  let component: SolicitudConvenioComponent;
  let fixture: ComponentFixture<SolicitudConvenioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudConvenioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudConvenioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
