import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListsolConvenioComponent } from './listsol-convenio.component';

describe('ListsolConvenioComponent', () => {
  let component: ListsolConvenioComponent;
  let fixture: ComponentFixture<ListsolConvenioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListsolConvenioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListsolConvenioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
