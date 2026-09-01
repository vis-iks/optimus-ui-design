import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { Button } from '@openng/optimus-ui/button';
import { InputText } from '@openng/optimus-ui/inputtext';
import { ToastModule } from '@openng/optimus-ui/toast';
import { MessageService } from '@openng/optimus-ui/api';
import { CardModule } from '@openng/optimus-ui/card';
import { Message } from '@openng/optimus-ui/message';
import { PasswordModule } from '@openng/optimus-ui/password';

@Component({
  selector: 'app-login-block',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Button,
    InputText,
    ToastModule,
    CardModule,
    Message,
    PasswordModule,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginBlock {
  private readonly messageService = inject(MessageService);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected onLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.messageService.add({
      severity: 'info',
      summary: 'Login',
      detail: `Email: ${email} | Password: ${password}`,
      life: 5000,
    });
  }
}
