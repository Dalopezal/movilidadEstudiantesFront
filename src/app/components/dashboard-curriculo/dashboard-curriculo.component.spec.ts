import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCurriculoComponent } from './dashboard-curriculo.component';

describe('DashboardCooperacionComponent', () => {
  let component: DashboardCurriculoComponent;
  let fixture: ComponentFixture<DashboardCurriculoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCurriculoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCurriculoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
