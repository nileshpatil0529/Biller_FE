

import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViewChild as NgViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ProductsService, Product } from './products.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})

export class ProductsComponent implements OnInit, AfterViewInit {
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  clearFilter(input?: HTMLInputElement) {
    this.dataSource.filter = '';
    if (input) {
      input.value = '';
    }
  }
  products: Product[] = [];
  dataSource = new MatTableDataSource<Product>();
  pageSize = 5;
  pageSizeOptions = [5, 10, 20, 30, 40, 50];
  total = 0;
  displayedColumns: string[] = [
    'code',
    'name',
    'nameHindi',
    'unit',
    'price',
    'stockQty',
    'actions',
  ];
  isHomeView = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  productForm: FormGroup;
  editingProduct: Product | null = null;
  showForm = false;
  addingRow = false;
  units: string[] = ['pcs', 'box', 'kg', 'ltr', 'meter', 'dozen'];

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      nameHindi: ['', Validators.required],
      unit: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stockQty: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.isHomeView = this.router.url === '/home';
    this.products = this.productsService.getProducts();
    if (this.isHomeView) {
      this.products = this.products.map(p => ({ ...p, sell_qty: 0 }));
      this.displayedColumns = [
        'name',
        'nameHindi',
        'unit',
        'price',
        'actions',
      ];
    }
    this.total = this.products.length;
    this.dataSource = new MatTableDataSource<Product>(this.products);
  }
  // For home view: increment/decrement sell_qty
  incrementQty(product: any) {
    if (typeof product.sell_qty !== 'number') product.sell_qty = 0;
    product.sell_qty++;
  }
  decrementQty(product: any) {
    if (typeof product.sell_qty !== 'number') product.sell_qty = 0;
    if (product.sell_qty > 0) product.sell_qty--;
  }
  onSellQtyInput(product: any, event: any) {
    const val = parseInt(event.target.value, 10);
    product.sell_qty = isNaN(val) ? 0 : val;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  onMatPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
  }

  openForm(product: Product): void {
    this.showForm = true;
    this.editingProduct = product;
    this.productForm.patchValue(product);
    this.addingRow = false;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingProduct = null;
    this.productForm.reset({ price: 0, stockQty: 0 });
    this.addingRow = false;
  }

  addRow(): void {
    if (this.addingRow) return;
    this.addingRow = true;
    this.showForm = false;
    this.productForm.reset({ price: 0, stockQty: 0 });
    // Insert a blank row at the top for editing
    this.products = [
      {
        code: '',
        name: '',
        nameHindi: '',
        unit: '',
        price: 0,
        stockQty: 0,
      },
      ...this.productsService.getProducts(),
    ];
    this.dataSource.data = this.products;
    this.total = this.products.length;
    // Focus the first input if needed (handled by Angular)
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;
    const product = this.productForm.value;
    if (this.addingRow) {
      this.productsService.addProduct(product);
      this.addingRow = false;
    } else if (this.editingProduct) {
      // Find the index in the full products array
      const idx = this.products.findIndex((p) => p === this.editingProduct);
      if (idx !== -1) {
        this.productsService.updateProduct(idx, product);
      }
      this.showForm = false;
      this.editingProduct = null;
    }
    this.products = this.productsService.getProducts();
    this.dataSource.data = this.products;
    this.total = this.products.length;
    this.productForm.reset({ price: 0, stockQty: 0 });
  }

  cancelNewRow(): void {
    this.addingRow = false;
    this.products = this.productsService.getProducts();
    this.dataSource.data = this.products;
    this.total = this.products.length;
    this.productForm.reset({ price: 0, stockQty: 0 });
  }

  async deleteProduct(index: number): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product?',
      },
    });
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.productsService.deleteProduct(index);
      this.products = this.productsService.getProducts();
      this.total = this.products.length;
      this.dataSource.data = this.products;
    }
  }

  importProducts(): void {
    alert('Import functionality has been disabled.');
  }

  exportProducts(): void {
    const products = this.productsService.getProducts();
    const csv = [
      'code,name,nameHindi,unit,price,stockQty',
      ...products.map((p) =>
        [p.code, p.name, p.nameHindi, p.unit, p.price, p.stockQty].join(',')
      ),
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
