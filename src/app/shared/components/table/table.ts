import { Component, input, output, computed, signal, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaginationComponent } from "../pagination/pagination.component";

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'date' | 'boolean' | 'avatar' | 'custom';
  badgeColors?: { [value: string]: string };
  avatarKey?: string;
  trueLabel?: string;
  falseLabel?: string;
  formatter?: (value: any, row: any) => any;
  sortable?: boolean;
  icon?: string;
  showInitials?: boolean;
}

export interface TableAction {
  type: 'edit' | 'delete' | 'custom';
  label?: string;
  icon?: 'edit' | 'delete' | 'view' | 'download' | 'file-text' | 'picture-as-pdf';
  routerLinkFn?: (row: any) => string[];
  clickFn?: (row: any) => void;
  colorClass?: string;
  visibleFn?: (row: any) => boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class DynamicTableComponent<T = any> {

  // Inputs
  columns = input.required<TableColumn[]>();
  data = input.required<T[]>();
  actions = input<TableAction[]>([]);
  isLoading = input<boolean>(false);
  error = input<string | null>(null);
  totalItems = input<number>(0);
  pageSize = input<number>(10);
  currentPage = input<number>(1);
  showPagination = input<boolean>(true);

  @ContentChild('customTemplate', { static: false })
  customTemplate: TemplateRef<any> | null = null;
  // TrackBy configurable
  trackByFn = input<(index: number, row: T) => any>((i, row: any) => row?.id ?? i);

  // Outputs
  pageChange = output<number>();
  retry = output<void>();
  sortChange = output<{ column: string; direction: 'asc' | 'desc' }>();

  // Signals
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');
  localPage = signal(1);

  Math = Math;

  // Computed
  effectiveTotalItems = computed(() => this.totalItems() || this.data().length);

  totalPages = computed(() =>
    Math.ceil(this.effectiveTotalItems() / Math.max(this.pageSize(), 1))
  );

  effectiveCurrentPage = computed(() => {
    const page = this.currentPage() > 1 ? this.currentPage() : this.localPage();
    return Math.min(Math.max(page, 1), Math.max(this.totalPages(), 1));
  });

  shouldPaginateLocally = computed(() =>
    this.showPagination() &&
    this.totalPages() > 1 &&
    this.effectiveTotalItems() === this.data().length
  );

  paginatedData = computed(() => {
    if (!this.shouldPaginateLocally()) return this.data();

    const size = Math.max(this.pageSize(), 1);
    const start = (this.effectiveCurrentPage() - 1) * size;

    return this.data().slice(start, start + size);
  });

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.effectiveCurrentPage();
    const delta = 2;

    const range: number[] = [];

    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }

    return range;
  });

  empty = computed(() =>
    !this.isLoading() &&
    !this.error() &&
    this.data().length === 0
  );

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.localPage.set(page);
    this.pageChange.emit(page);
  }

  onSort(col: TableColumn) {
    if (!col.sortable) return;

    if (this.sortColumn() === col.key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col.key);
      this.sortDirection.set('asc');
    }

    this.sortChange.emit({
      column: col.key,
      direction: this.sortDirection(),
    });
  }

  getCellValue(row: any, col: TableColumn): any {
    const value = col.key
      .split('.')
      .reduce((obj, key) => obj?.[key], row);

    return col.formatter ? col.formatter(value, row) : value;
  }

  getAvatarSubtitle(row: any, col: TableColumn): any {
    if (!col.avatarKey) return null;

    return col.avatarKey
      .split('.')
      .reduce((obj: any, key: string) => obj?.[key], row);
  }

  getInitials(value: string): string {
    return value
      ?.split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  }

  getBadgeClass(col: TableColumn, value: any): string {
    if (col.badgeColors?.[value]) return col.badgeColors[value];
    return 'bg-gray-100 text-gray-800';
  }

  getActionRouterLink(action: TableAction, row: any): string[] {
    return action.routerLinkFn ? action.routerLinkFn(row) : [];
  }

  isActionVisible(action: TableAction, row: any): boolean {
    if (!action.visibleFn) return true;
    return action.visibleFn(row);
  }

  getActionIcon(action: TableAction): string {
    const icons: Record<string, string> = {
      view: 'visibility',
      download: 'download',
      'file-text': 'description',
      'picture-as-pdf': 'picture_as_pdf',
    };
    return icons[action.icon || 'view'] || 'visibility';
  }
}
