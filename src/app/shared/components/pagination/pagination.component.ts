import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 0;
  @Input() pageSize = 10;
  @Input() totalItems = 0;

  @Input() pages: number[] = [];

  @Output() pageChange = new EventEmitter<number>();

  /**
   * Índice inicial (ej: 11 en página 2 con pageSize 10)
   */
  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  /**
   * Índice final (ej: 20 en página 2 con pageSize 10)
   */
  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  /**
   * Ir a página anterior
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  /**
   * Ir a página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  /**
   * Ir a página específica
   */
  goToPage(page: number): void {
    this.pageChange.emit(page);
  }
}