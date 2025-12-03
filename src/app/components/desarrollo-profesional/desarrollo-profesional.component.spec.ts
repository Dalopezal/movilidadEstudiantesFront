import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesarrolloProfesionalComponent } from './desarrollo-profesional.component';

describe('DesarrolloProfesionalComponent', () => {
  let component: DesarrolloProfesionalComponent;
  let fixture: ComponentFixture<DesarrolloProfesionalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesarrolloProfesionalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesarrolloProfesionalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
