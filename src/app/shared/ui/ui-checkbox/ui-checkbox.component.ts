import {
  Component,
  EventEmitter,
  Input,
  Output,
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
  selector: 'ui-checkbox',
  standalone: true,
  templateUrl: './ui-checkbox.component.html',
  styleUrls: ['./ui-checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckboxComponent),
      multi: true,
    },
  ],
})
export class UiCheckboxComponent implements ControlValueAccessor, OnInit {
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
  @Input() className = '';
  @Input() checked = false;

  @Output() valueChange = new EventEmitter<boolean>();

  internalDisabled = false;

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private injector: Injector, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const ngControl = this.ngControl;
    if (ngControl) {
      ngControl.valueAccessor = this;
    }
  }

  get ngControl(): NgControl | null {
    try {
      return this.injector.get(NgControl, null);
    } catch {
      return null;
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

  get currentValue(): boolean {
    if (this.resolvedControl) {
      return !!this.resolvedControl.value;
    }

    return !!this.checked;
  }

  get containerClasses(): string {
    const widthClass = this.fullWidth ? 'w-full' : 'w-auto';
    return `flex flex-col gap-1 ${widthClass} ${this.className}`.trim();
  }

  get checkboxClasses(): string {
    const sizeClass = this.size === 'sm' ? 'h-3.5 w-3.5' : this.size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

    const stateClass = this.isDisabled
      ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed opacity-80'
      : this.isInvalid
        ? 'border-red-500 text-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
        : 'border-gray-300 text-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

    return `${sizeClass} rounded ${stateClass}`;
  }

  get labelClasses(): string {
    if (this.isDisabled) {
      return 'text-sm text-gray-500 cursor-not-allowed';
    }

    if (this.isInvalid) {
      return 'text-sm text-red-700';
    }

    return 'text-sm text-gray-700';
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

  writeValue(value: boolean): void {
    this.checked = !!value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.internalDisabled = isDisabled;
  }

  onToggle(nextValue: boolean): void {
    this.checked = nextValue;
    this.onChange(nextValue);
    this.valueChange.emit(nextValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}
