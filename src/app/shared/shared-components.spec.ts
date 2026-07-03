import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, NgControl, Validators } from '@angular/forms';
import { DynamicTableComponent, TableColumn } from './components/table/table';
import { PaginationComponent } from './components/pagination/pagination.component';
import { UiButtonComponent } from './ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from './ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from './ui/ui-input/ui-input.component';
import { getErrorMessage, isInvalidControl, resolveControl } from './forms/errors';

describe('DynamicTableComponent', () => {
  let fixture: ComponentFixture<DynamicTableComponent<any>>;
  let component: DynamicTableComponent<any>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicTableComponent<any>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nombre', sortable: true }]);
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Uno' },
      { id: 2, name: 'Dos' },
      { id: 3, name: 'Tres' },
    ]);
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();
  });

  it('paginates local data', () => {
    expect(component.totalPages()).toBe(2);
    expect(component.paginatedData().map((row) => row.id)).toEqual([1, 2]);

    component.onPageChange(2);

    expect(component.effectiveCurrentPage()).toBe(2);
    expect(component.paginatedData().map((row) => row.id)).toEqual([3]);
  });

  it('emits sort changes and toggles direction', () => {
    const emissions: Array<{ column: string; direction: 'asc' | 'desc' }> = [];
    component.sortChange.subscribe((event) => emissions.push(event));
    const column = { key: 'name', label: 'Nombre', sortable: true } satisfies TableColumn;

    component.onSort(column);
    component.onSort(column);

    expect(emissions).toEqual([
      { column: 'name', direction: 'asc' },
      { column: 'name', direction: 'desc' },
    ]);
  });

  it('reads nested values and applies formatters', () => {
    const value = component.getCellValue(
      { customer: { name: 'Ana' } },
      { key: 'customer.name', label: 'Cliente', formatter: (item) => item.toUpperCase() },
    );

    expect(value).toBe('ANA');
  });
});

describe('PaginationComponent', () => {
  it('calculates visible item range', () => {
    const component = new PaginationComponent();
    component.currentPage = 2;
    component.pageSize = 10;
    component.totalItems = 25;

    expect(component.startItem).toBe(11);
    expect(component.endItem).toBe(20);
  });

  it('emits previous and next page changes within bounds', () => {
    const component = new PaginationComponent();
    const pages: number[] = [];
    component.currentPage = 2;
    component.totalPages = 3;
    component.pageChange.subscribe((page) => pages.push(page));

    component.prevPage();
    component.nextPage();
    component.goToPage(3);

    expect(pages).toEqual([1, 3, 3]);
  });
});

describe('UiButtonComponent', () => {
  it('does not emit click events while loading or as submit button', () => {
    const component = new UiButtonComponent();
    const event = new MouseEvent('click');
    const clicked = jasmine.createSpy('clicked');
    component.clicked.subscribe(clicked);

    component.loading = true;
    component.handleClick(event);
    component.loading = false;
    component.type = 'submit';
    component.handleClick(event);

    expect(clicked).not.toHaveBeenCalled();
  });

  it('builds classes and emits normal button clicks', () => {
    const component = new UiButtonComponent();
    const clicked = jasmine.createSpy('clicked');
    const event = new MouseEvent('click');
    component.clicked.subscribe(clicked);
    component.variant = 'danger';
    component.size = 'lg';
    component.fullWidth = true;

    component.handleClick(event);

    expect(component.buttonClasses).toContain('w-full');
    expect(component.buttonClasses).toContain('bg-red-600');
    expect(component.buttonClasses).toContain('px-6');
    expect(component.isDisabled).toBeFalse();
    expect(clicked).toHaveBeenCalledWith(event);
  });
});

describe('UiCheckboxComponent', () => {
  it('updates value and emits changes', async () => {
    await TestBed.configureTestingModule({
      imports: [UiCheckboxComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(UiCheckboxComponent);
    const component = fixture.componentInstance;
    const emitted: boolean[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));

    component.onToggle(true);

    expect(component.checked).toBeTrue();
    expect(emitted).toEqual([true]);
  });

  it('covers value accessor state, classes and invalid messages', () => {
    const control = new FormControl('', { validators: Validators.required });
    control.markAsTouched();
    const fixture = TestBed.createComponent(UiCheckboxComponent);
    const component = fixture.componentInstance;
    const change = jasmine.createSpy('change');
    const touched = jasmine.createSpy('touched');
    component.control = control;
    component.errorText = 'Requerido';
    component.size = 'lg';
    component.className = 'custom';
    component.fullWidth = false;
    component.registerOnChange(change);
    component.registerOnTouched(touched);

    expect(component.currentValue).toBeFalse();
    expect(component.isInvalid).toBeTrue();
    expect(component.containerClasses).toContain('w-auto');
    expect(component.containerClasses).toContain('custom');
    expect(component.checkboxClasses).toContain('h-5');
    expect(component.labelClasses).toContain('text-red');
    expect(component.messageText).toBe('Requerido');
    expect(component.messageClass).toContain('text-red');

    component.writeValue(true);
    component.setDisabledState(true);
    component.onToggle(false);
    component.onBlur();

    expect(component.isDisabled).toBeTrue();
    expect(change).toHaveBeenCalledWith(false);
    expect(touched).toHaveBeenCalled();
  });
});

describe('UiInputComponent', () => {
  it('covers value accessor state, sizes, invalid messages and input changes', () => {
    const control = new FormControl('', { validators: [Validators.required, Validators.minLength(3)] });
    control.markAsDirty();
    const fixture = TestBed.createComponent(UiInputComponent);
    const component = fixture.componentInstance;
    const change = jasmine.createSpy('change');
    const touched = jasmine.createSpy('touched');
    component.control = control;
    component.appearance = 'compact';
    component.size = 'sm';
    component.className = 'wide';
    component.errorText = 'Campo requerido';
    component.registerOnChange(change);
    component.registerOnTouched(touched);

    expect(component.containerClasses).toContain('wide');
    expect(component.inputClasses).toContain('px-2');
    expect(component.stateClasses).toContain('border-red');
    expect(component.messageText).toBe('Campo requerido');

    component.onInput('abc');
    component.onBlur();
    component.setDisabledState(true);
    component.size = 'lg';
    component.appearance = 'default';

    expect(component.value).toBe('abc');
    expect(component.sizeClasses).toContain('px-4');
    expect(component.stateClasses).toContain('cursor-not-allowed');
    expect(change).toHaveBeenCalledWith('abc');
    expect(touched).toHaveBeenCalled();
  });
});

describe('form error helpers', () => {
  it('resolves controls and invalid state', () => {
    const control = new FormControl('');
    control.setErrors({ required: true });
    control.markAsTouched();

    expect(resolveControl(null)).toBeNull();
    expect(resolveControl(control)).toBe(control);
    expect(isInvalidControl(control)).toBeTrue();
  });

  it('returns messages for known and fallback validation errors', () => {
    const control = new FormControl('');

    control.setErrors({ required: true });
    expect(getErrorMessage(control)).toBe('Este campo es obligatorio');

    control.setErrors({ minlength: { requiredLength: 3 } });
    expect(getErrorMessage(control)).toContain('3');

    control.setErrors({ maxlength: { requiredLength: 10 } });
    expect(getErrorMessage(control)).toContain('10');

    control.setErrors({ email: true });
    expect(getErrorMessage(control)).toContain('Email');

    control.setErrors({ pattern: true });
    expect(getErrorMessage(control)).toContain('Formato');

    control.setErrors({ custom: true });
    expect(getErrorMessage(control)).toContain('Formato');

    control.setErrors({});
    expect(getErrorMessage(control)).toBe('');
  });

  it('resolves NgControl wrappers', () => {
    const control = new FormControl('value');
    class FakeNgControl extends NgControl {
      override name = 'fake';
      override valueAccessor = null;
      override get control(): FormControl {
        return control;
      }

      override viewToModelUpdate(): void {}
    }
    const ngControl = new FakeNgControl();

    expect(resolveControl(ngControl)).toBe(control);
  });
});
