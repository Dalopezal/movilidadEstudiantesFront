import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCooperacionComponent } from './dashboard-cooperacion.component';

describe('DashboardCooperacionComponent', () => {
  let component: DashboardCooperacionComponent;
  let fixture: ComponentFixture<DashboardCooperacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCooperacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCooperacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
