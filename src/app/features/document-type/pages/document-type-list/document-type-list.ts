import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { DynamicTableComponent, TableColumn } from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { DocumentType } from '../../../folio/models/folio.model';
import { DocumentTypeService } from '../../services/document-type.service';

@Component({
  selector: 'app-document-type-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DynamicTableComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './document-type-list.html',
  styleUrl: './document-type-list.scss',
})
export class DocumentTypeList implements OnInit {
  documentTypes: DocumentType[] = [];
  filteredDocumentTypes: DocumentType[] = [];
  searchTerm = '';
  isLoading = false;
  error: string | null = null;

  readonly columns: TableColumn[] = [
    { key: 'codigoSii', label: 'Código SII', sortable: true },
    { key: 'descripcion', label: 'Descripción', type: 'avatar', avatarKey: 'codigoSii' },
  ];

  constructor(private documentTypeService: DocumentTypeService) {}

  ngOnInit(): void {
    this.loadDocumentTypes();
  }

  loadDocumentTypes(): void {
    this.isLoading = true;
    this.error = null;
    this.documentTypeService.findAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (documentTypes) => {
          this.documentTypes = documentTypes;
          this.filter();
        },
        error: () => this.error = 'No fue posible cargar los tipos de documento.',
      });
  }

  filter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredDocumentTypes = !term
      ? [...this.documentTypes]
      : this.documentTypes.filter((type) =>
          String(type.codigoSii).includes(term) ||
          type.descripcion.toLowerCase().includes(term)
        );
  }

  clearFilter(): void {
    this.searchTerm = '';
    this.filter();
  }
}
