import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { ProductRequest } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule, UiButtonComponent, UiCheckboxComponent, UiInputComponent],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {
  productId: number | null = null;
  isLoading = false;
  isSaving = false;
  error: string | null = null;

  product: ProductRequest = {
    codigo: '',
    nombre: '',
    descripcion: '',
    unidadMedida: 'UN',
    precio: 0,
    afectaIva: true,
    activo: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
  ) {}

  get isEditMode(): boolean {
    return this.productId !== null;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.productId = id;
      this.loadProduct(id);
    }
  }

  save(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;
    const request = { ...this.product, precio: Number(this.product.precio) };
    const operation = this.productId
      ? this.productService.update(this.productId, request)
      : this.productService.create(request);

    operation.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message ?? 'No fue posible guardar el producto.';
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/productos']);
  }

  private loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.findById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (product) => {
          this.product = {
            codigo: product.codigo ?? '',
            nombre: product.nombre ?? '',
            descripcion: product.descripcion ?? '',
            unidadMedida: product.unidadMedida ?? '',
            precio: product.precio ?? 0,
            afectaIva: product.afectaIva ?? true,
            activo: product.activo ?? true,
          };
        },
        error: () => this.error = 'No fue posible cargar el producto.',
      });
  }
}
