import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  Injector,
  ChangeDetectorRef,
  forwardRef,
} from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { getErrorMessage, isInvalidControl, resolveControl } from '../../forms/errors';

type UiFieldSize = 'sm' | 'md' | 'lg';
type UiAppearance = 'default' | 'compact';

@Component({
  selector: 'ui-input',
  standalone: true,
  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
})
export class UiInputComponent implements ControlValueAccessor, OnInit {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() helperText?: string;
  @Input() errorText?: string;
  @Input() required?: boolean;
  @Input() disabled?: boolean;
  @Input() id?: string;
  @Input() name?: string;
  @Input() appearance: UiAppearance = 'default';
  @Input() size: UiFieldSize = 'md';
  @Input() fullWidth = true;
  @Input() control?: AbstractControl | NgControl | null;
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'url' | 'date' | 'tel' = 'text';
  @Input() className = '';
  @Input() autocomplete?: string;
  @Input() maxLength?: number;

  value: string | number | null = '';
  internalDisabled = false;

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private injector: Injector, private cdr: ChangeDetectorRef) {
    // Use injector to lazily get NgControl to avoid circular dependencies
  }

  get ngControl(): NgControl | null {
    try {
      return this.injector.get(NgControl, null);
    } catch {
      return null;
    }
  }

  ngOnInit() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get resolvedControl(): AbstractControl | null {
    return resolveControl(this.control ?? this.ngControl ?? null);
  }

  get isInvalid(): boolean {
    return isInvalidControl(this.resolvedControl);
  }

  get isDisabled(): boolean {
    return !!this.disabled || this.internalDisabled;
  }

  get containerClasses(): string {
    const widthClass = this.fullWidth ? 'w-full' : 'w-auto';
    return `flex flex-col gap-1 ${widthClass} ${this.className}`.trim();
  }

  get inputClasses(): string {
    const classes = [
      'w-full rounded-lg border text-sm outline-none transition',
      this.sizeClasses,
      this.stateClasses,
    ];

    return classes.join(' ');
  }

  get sizeClasses(): string {
    if (this.appearance === 'compact') {
      return this.size === 'sm'
        ? 'px-2 py-1'
        : this.size === 'lg'
          ? 'px-3 py-2'
          : 'px-2.5 py-1.5';
    }

    return this.size === 'sm'
      ? 'px-2.5 py-1.5'
      : this.size === 'lg'
        ? 'px-4 py-3'
        : 'px-3 py-2';
  }

  get stateClasses(): string {
    if (this.isDisabled) {
      return 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed opacity-80';
    }

    if (this.isInvalid) {
      return 'border-red-500 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:border-red-500';
    }

    return 'border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:border-blue-500';
  }

  get messageText(): string {
    if (this.isInvalid) {
      return this.errorText || getErrorMessage(this.resolvedControl);
    }

    return this.helperText || '';
  }

  get messageClass(): string {
    return this.isInvalid ? 'text-xs text-red-600 min-h-[1rem]' : 'text-xs text-gray-500 min-h-[1rem]';
  }

  writeValue(value: string | number | null): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.internalDisabled = isDisabled;
  }

  onInput(value: string): void {
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
