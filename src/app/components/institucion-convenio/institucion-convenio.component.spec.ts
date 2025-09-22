import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstitucionConvenioComponent } from './institucion-convenio.component';

describe('InstitucionConvenioComponent', () => {
  let component: InstitucionConvenioComponent;
  let fixture: ComponentFixture<InstitucionConvenioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstitucionConvenioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstitucionConvenioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
