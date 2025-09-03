import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntregableComponent } from './entregable.component';

describe('EntregableComponent', () => {
  let component: EntregableComponent;
  let fixture: ComponentFixture<EntregableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntregableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntregableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
