import { of, throwError } from 'rxjs';
import { DocumentType } from '../../../folio/models/folio.model';
import { DocumentTypeService } from '../../services/document-type.service';
import { DocumentTypeList } from './document-type-list';

describe('Document type module', () => {
  const factura: DocumentType = { id: 1, codigoSii: 33, descripcion: 'Factura electronica' };
  const boleta: DocumentType = { id: 2, codigoSii: 39, descripcion: 'Boleta electronica' };

  it('loads and filters document types by code or description', () => {
    const service = jasmine.createSpyObj<DocumentTypeService>('DocumentTypeService', ['findAll']);
    service.findAll.and.returnValue(of([factura, boleta]));
    const component = new DocumentTypeList(service);

    component.ngOnInit();
    component.searchTerm = '33';
    component.filter();

    expect(component.filteredDocumentTypes).toEqual([factura]);
  });

  it('clears document type filters', () => {
    const component = new DocumentTypeList({} as DocumentTypeService);
    component.documentTypes = [factura];
    component.searchTerm = 'factura';

    component.clearFilter();

    expect(component.searchTerm).toBe('');
    expect(component.filteredDocumentTypes).toEqual([factura]);
  });

  it('shows document type load errors', () => {
    const service = jasmine.createSpyObj<DocumentTypeService>('DocumentTypeService', ['findAll']);
    service.findAll.and.returnValue(throwError(() => new Error('boom')));
    const component = new DocumentTypeList(service);

    component.loadDocumentTypes();

    expect(component.error).toContain('tipos de documento');
  });
});
