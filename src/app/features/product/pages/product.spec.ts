import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductResponse } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { ProductForm } from './product-form/product-form';
import { ProductList } from './product-list/product-list';

describe('Product module', () => {
  const product: ProductResponse = {
    id: 3,
    codigo: 'SKU-1',
    nombre: 'Servicio',
    descripcion: 'Mensual',
    unidadMedida: 'UN',
    precio: 1000,
    afectaIva: true,
    activo: true,
  };

  it('loads products and filters by text', () => {
    const service = jasmine.createSpyObj<ProductService>('ProductService', ['findAll']);
    service.findAll.and.returnValue(of([product, { ...product, id: 4, nombre: 'Otro', codigo: 'OTRO' }]));
    const component = new ProductList({} as Router, service);

    component.ngOnInit();
    component.searchTerm = 'sku-1';
    component.applyFilter();

    expect(component.filteredProducts.map((item) => item.id)).toEqual([3]);
  });

  it('deletes products after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const service = jasmine.createSpyObj<ProductService>('ProductService', ['delete']);
    service.delete.and.returnValue(of(void 0));
    const component = new ProductList({} as Router, service);
    component.products = [product];

    component.deleteProduct(product);

    expect(service.delete).toHaveBeenCalledWith(3);
    expect(component.products).toEqual([]);
  });

  it('saves product prices as numbers', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const service = jasmine.createSpyObj<ProductService>('ProductService', ['create']);
    service.create.and.returnValue(of(product));
    const component = new ProductForm({ snapshot: { paramMap: { get: () => null } } } as any, router, service);
    component.product = { codigo: 'SKU', nombre: 'Servicio', descripcion: '', unidadMedida: 'UN', precio: '1200' as any, afectaIva: true, activo: true };
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.save(form);

    expect(service.create).toHaveBeenCalledWith(jasmine.objectContaining({ precio: 1200 }));
    expect(router.navigate).toHaveBeenCalledWith(['/productos']);
  });

  it('loads and updates products in edit mode', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const service = jasmine.createSpyObj<ProductService>('ProductService', ['findById', 'update']);
    service.findById.and.returnValue(of(product));
    service.update.and.returnValue(of(product));
    const component = new ProductForm({ snapshot: { paramMap: { get: () => '3' } } } as any, router, service);
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.ngOnInit();
    component.save(form);

    expect(component.isEditMode).toBeTrue();
    expect(component.product.nombre).toBe(product.nombre);
    expect(service.update).toHaveBeenCalledWith(3, jasmine.objectContaining({ codigo: product.codigo }));
  });

  it('does not save invalid product forms and navigates on cancel', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const service = jasmine.createSpyObj<ProductService>('ProductService', ['create']);
    const component = new ProductForm({ snapshot: { paramMap: { get: () => null } } } as any, router, service);
    const form = { invalid: true, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.save(form);
    component.cancel();

    expect(form.control.markAllAsTouched).toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/productos']);
  });

  it('surfaces product load errors', () => {
    const service = jasmine.createSpyObj<ProductService>('ProductService', ['findAll']);
    service.findAll.and.returnValue(throwError(() => new Error('boom')));
    const component = new ProductList({} as Router, service);

    component.loadProducts();

    expect(component.error).toContain('productos');
  });
});
