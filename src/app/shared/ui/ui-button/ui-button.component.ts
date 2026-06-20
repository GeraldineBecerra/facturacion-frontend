import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.scss']
})
export class UiButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() type: ButtonType = 'button';
  @Input() icon: string | null = null;
  @Input() fullWidth: boolean = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  /**
   * Computed classes for the button based on variant, size, and state
   */
  get buttonClasses(): string {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-lg',
      'font-medium',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    ];

    // Full width
    if (this.fullWidth) {
      baseClasses.push('w-full');
    }

    // Size classes
    const sizeClasses: Record<ButtonSize, string[]> = {
      sm: ['px-3', 'py-1.5', 'text-sm'],
      md: ['px-4', 'py-2', 'text-sm'],
      lg: ['px-6', 'py-2.5', 'text-base']
    };

    // Variant classes
    const variantClasses: Record<ButtonVariant, string[]> = {
      primary: [
        'bg-blue-600',
        'text-white',
        'hover:bg-blue-700',
        'focus:ring-blue-500'
      ],
      secondary: [
        'bg-white',
        'text-gray-700',
        'border',
        'border-gray-300',
        'hover:bg-gray-50',
        'focus:ring-gray-400'
      ],
      danger: [
        'bg-red-600',
        'text-white',
        'hover:bg-red-700',
        'focus:ring-red-500'
      ],
      ghost: [
        'bg-transparent',
        'text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-gray-300'
      ]
    };

    return [
      ...baseClasses,
      ...sizeClasses[this.size],
      ...variantClasses[this.variant]
    ].join(' ');
  }

  /**
   * Determines if the button should be disabled
   */
  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  /**
   * Handle click events - only emit if not submit type
   */
  handleClick(event: MouseEvent): void {
    if (this.type !== 'submit' && !this.isDisabled) {
      this.clicked.emit(event);
    }
  }
}
