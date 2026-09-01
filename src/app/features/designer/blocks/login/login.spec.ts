import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { LoginBlock } from './login';

describe('LoginBlock', () => {
  let component: LoginBlock;
  let fixture: ComponentFixture<LoginBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginBlock],
      providers: [provideOptimus({ theme: { preset: Aura } })],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
