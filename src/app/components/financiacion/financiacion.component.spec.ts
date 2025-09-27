import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanciacionComponent } from './financiacion.component';

describe('FinanciacionComponent', () => {
  let component: FinanciacionComponent;
  let fixture: ComponentFixture<FinanciacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanciacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanciacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
