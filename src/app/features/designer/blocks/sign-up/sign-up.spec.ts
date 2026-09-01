import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { SignUpBlock } from './sign-up';

describe('SignUpBlock', () => {
  let component: SignUpBlock;
  let fixture: ComponentFixture<SignUpBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpBlock],
      providers: [provideOptimus({ theme: { preset: Aura } })],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
