import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { DashboardBlock } from './dashboard';

describe('DashboardBlock', () => {
  let component: DashboardBlock;
  let fixture: ComponentFixture<DashboardBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardBlock],
      providers: [provideOptimus({ theme: { preset: Aura } })],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
