import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { EditorFooter } from './editor-footer';
import { ThemeDesignerService } from '../services/theme-designer.service';

describe('EditorFooter', () => {
  let fixture: ComponentFixture<EditorFooter>;
  let component: EditorFooter;
  let el: HTMLElement;
  let service: ThemeDesignerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorFooter],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOptimus({ theme: { preset: Aura } }),
      ],
    }).compileComponents();

    service = TestBed.inject(ThemeDesignerService);
    service.designer.update((prev) => ({
      ...prev,
      theme: {
        name: 'Test',
        preset: { primitive: { color: '#fff' } },
        config: { fontSize: '14px', fontFamily: 'Inter var' },
      },
    }));

    fixture = TestBed.createComponent(EditorFooter);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render Download button', () => {
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Download'),
    );
    expect(btn).toBeTruthy();
  });

  it('should render Publish button and open the publish dialog', () => {
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Publish'),
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(el.querySelector('design-publish-dialog')).toBeTruthy();
  });

  it('should render Apply button', () => {
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Apply'),
    );
    expect(btn).toBeTruthy();
  });

  it('should call applyTheme when Apply is clicked', () => {
    const spy = vi.spyOn(service, 'applyTheme');
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Apply'),
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should call encodeTheme when Download button is clicked', () => {
    const spy = vi.spyOn(service, 'encodeTheme').mockReturnValue('dGVzdA==');
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Download'),
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should populate base64 value in the dialog when Download is clicked', () => {
    vi.spyOn(service, 'encodeTheme').mockReturnValue('bXktYmFzZTY0LXZhbHVl');
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Download'),
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const textarea = el.querySelector('textarea');
    expect(textarea?.value).toBe('bXktYmFzZTY0LXZhbHVl');
  });

  it('should call downloadTheme when Download .ts File button is clicked', () => {
    const downloadSpy = vi.spyOn(service, 'downloadTheme').mockResolvedValue();
    vi.spyOn(service, 'encodeTheme').mockReturnValue('dGVzdA==');

    // Open the dialog first
    const downloadBtn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Download'),
    ) as HTMLButtonElement;
    downloadBtn.click();
    fixture.detectChanges();

    // Click the Download .ts File button in the dialog
    const tsBtn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Download .ts File'),
    ) as HTMLButtonElement;
    tsBtn.click();

    expect(downloadSpy).toHaveBeenCalled();
  });
});
