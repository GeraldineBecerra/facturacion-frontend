import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { UiButtonComponent } from '../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../shared/ui/ui-input/ui-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, UiButtonComponent, UiCheckboxComponent, UiInputComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  credentials = { username: '', password: '' };
  remember = true;
  showPassword = false;
  isLoading = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl(this.auth.landingRoute());
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(form: NgForm): void {
    if (form.invalid || this.isLoading) {
      form.control.markAllAsTouched();
      this.error = 'Ingresa usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.auth.login(this.credentials, this.remember)
      .pipe(
        timeout(10000),
        finalize(() => this.isLoading = false),
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.auth.landingRoute());
        },
        error: (error: any) => {
          if (error.name === 'TimeoutError') {
            this.error = 'El servidor tardó demasiado en responder.';
            return;
          }

          this.error = error.error?.mensaje
            || error.error?.message
            || error.message
            || (error.status === 0
              ? 'No fue posible conectar con el servidor.'
              : 'Usuario o contraseña incorrectos.');
        },
      });
  }
}
