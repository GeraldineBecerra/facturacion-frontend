import { AbstractControl, NgControl, ValidationErrors } from '@angular/forms';

function hasError(errors: ValidationErrors | null | undefined, key: string): boolean {
  return !!errors && key in errors;
}

export function resolveControl(
  control?: AbstractControl | NgControl | null
): AbstractControl | null {
  if (!control) {
    return null;
  }

  if (control instanceof NgControl) {
    return control.control;
  }

  return control;
}

export function isInvalidControl(
  control?: AbstractControl | NgControl | null
): boolean {
  const resolved = resolveControl(control);
  if (!resolved) {
    return false;
  }

  return !!(resolved.invalid && (resolved.touched || resolved.dirty));
}

export function getErrorMessage(control?: AbstractControl | NgControl | null): string {
  const resolved = resolveControl(control);
  const errors = resolved?.errors;

  if (!errors) {
    return '';
  }

  if (hasError(errors, 'required')) {
    return 'Este campo es obligatorio';
  }

  if (hasError(errors, 'minlength')) {
    return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
  }

  if (hasError(errors, 'maxlength')) {
    return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
  }

  if (hasError(errors, 'email')) {
    return 'Email inválido';
  }

  if (hasError(errors, 'pattern')) {
    return 'Formato inválido';
  }

  const firstErrorKey = Object.keys(errors)[0];
  return firstErrorKey ? 'Formato inválido' : '';
}
