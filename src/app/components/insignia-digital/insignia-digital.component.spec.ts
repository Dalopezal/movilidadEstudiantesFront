import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsigniaDigitalComponent } from './insignia-digital.component';

describe('InsigniaDigitalComponent', () => {
  let component: InsigniaDigitalComponent;
  let fixture: ComponentFixture<InsigniaDigitalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsigniaDigitalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsigniaDigitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
