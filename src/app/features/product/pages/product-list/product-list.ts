import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import {
  DynamicTableComponent,
  TableAction,
  TableColumn,
} from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { ProductResponse } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    DynamicTableComponent,
    UiButtonComponent,
    UiInputComponent,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  products: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  searchTerm = '';
  isLoading = false;
  error: string | null = null;

  readonly columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Producto', type: 'avatar', avatarKey: 'unidadMedida' },
    {
      key: 'precio',
      label: 'Precio',
      formatter: (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value ?? 0),
    },
    { key: 'afectaIva', label: 'Afecto a IVA', type: 'boolean' },
    { key: 'activo', label: 'Estado', type: 'boolean', trueLabel: 'Activo', falseLabel: 'Inactivo' },
  ];

  readonly actions: TableAction[] = [
    {
      type: 'edit',
      label: 'Editar producto',
      routerLinkFn: (product) => ['/productos', product.id, 'editar'],
    },
    {
      type: 'delete',
      label: 'Eliminar producto',
      clickFn: (product) => this.deleteProduct(product),
    },
  ];

  constructor(
    private router: Router,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.productService.findAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.applyFilter();
        },
        error: () => this.error = 'No fue posible cargar los productos.',
      });
  }

  createProduct(): void {
    this.router.navigate(['/productos/nuevo']);
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = !term
      ? [...this.products]
      : this.products.filter((product) =>
          [product.codigo, product.nombre, product.descripcion, product.unidadMedida]
            .some((value) => value?.toLowerCase().includes(term))
        );
  }

  clearFilter(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  deleteProduct(product: ProductResponse): void {
    if (!window.confirm(`¿Eliminar el producto "${product.nombre}"?`)) return;

    this.productService.delete(product.id).subscribe({
      next: () => {
        this.products = this.products.filter((item) => item.id !== product.id);
        this.applyFilter();
      },
      error: () => this.error = 'No fue posible eliminar el producto.',
    });
  }
}
