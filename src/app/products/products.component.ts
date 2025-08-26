import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { ProductsService, Product } from './products.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})

export class ProductsComponent implements OnInit, AfterViewInit {
  // Properties
  productSearch = '';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProductInDropdown: Product | null = null;
  
  // Table properties
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
    this.loadProducts();
    
    if (this.isHomeView) {
      this.displayedColumns = ['name', 'nameHindi', 'unit', 'price', 'actions'];
    }
  }

  private loadProducts(): void {
    this.products = this.productsService.getProducts();
    
    if (this.isHomeView) {
      this.products = this.products.map(p => ({ ...p, sell_qty: 0 }));
    }
    
    this.updateDataSource();
    this.filteredProducts = this.products;
  }

  private updateDataSource(): void {
    // For home view, only show products with sell_qty > 0
    const displayProducts = this.isHomeView 
      ? this.products.filter(p => (p.sell_qty || 0) > 0)
      : this.products;

    this.total = displayProducts.length;
    this.dataSource.data = displayProducts;
  }
  applyFilterAutocomplete(value: string) {
    const filterValue = value ? value.trim().toLowerCase() : '';
    this.filteredProducts = this.products.filter(product =>
      product.code.toLowerCase().includes(filterValue) ||
      product.name.toLowerCase().includes(filterValue) ||
      product.nameHindi.toLowerCase().includes(filterValue) ||
      product.unit.toLowerCase().includes(filterValue)
    );
  }

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

  clearFilterAutocomplete() {
    this.productSearch = '';
    this.filteredProducts = [];
    
    // Close panel and remove focus
    if (this.autocompleteTrigger) {
      this.autocompleteTrigger.closePanel();
    }
    if (this.searchInput && this.searchInput.nativeElement) {
      this.searchInput.nativeElement.blur();
    }
    
    // Reset products list after panel is closed
    requestAnimationFrame(() => {
      this.filteredProducts = this.products;
    });
  }

  displayProduct(product?: Product | null): string {
    return product && product.code ? `${product.code} - ${product.name}` : '';
  }

  private focusAndSelectSearchInput() {
    if (this.searchInput && this.searchInput.nativeElement) {
      const inputElement = this.searchInput.nativeElement as HTMLInputElement;
      
      // Focus the input
      inputElement.focus();
      
      // If there's text in the input, select it
      setTimeout(() => {
        if (this.productSearch) {
          inputElement.select();
        }
        
        // Open the autocomplete panel
        if (this.autocompleteTrigger) {
          this.autocompleteTrigger.openPanel();
        }
      }, 0);
    }
  }
  // For home view: increment/decrement sell_qty and handle selection
  handleQtyButton(product: Product, action: 'increment' | 'decrement', event: Event) {
    event.stopPropagation();
    
    // Update quantity
    if (typeof product.sell_qty !== 'number') product.sell_qty = 0;
    if (action === 'increment') {
      product.sell_qty++;
    } else if (action === 'decrement' && product.sell_qty > 0) {
      product.sell_qty--;
    }

    // Find the matching product from the original products array
    const matchingProduct = this.products.find(p => p.code === product.code);
    if (matchingProduct) {
      matchingProduct.sell_qty = product.sell_qty;
    }
    
    // Update product search and focus input
    this.selectedProductInDropdown = matchingProduct || product;
    this.productSearch = this.displayProduct(matchingProduct || product);
    this.focusAndSelectSearchInput();

    // Update table data to show/hide based on sell_qty
    this.updateDataSource();
  }

  onSellQtyInput(product: Product, event: any) {
    event.stopPropagation();
    const val = parseInt(event.target.value, 10);
    product.sell_qty = isNaN(val) ? 0 : val;
    
    // Find the matching product from the original products array
    const matchingProduct = this.products.find(p => p.code === product.code);
    if (matchingProduct) {
      matchingProduct.sell_qty = product.sell_qty;
    }
    
    // Update product search and focus input
    this.selectedProductInDropdown = matchingProduct || product;
    this.productSearch = this.displayProduct(matchingProduct || product);
    this.focusAndSelectSearchInput();

    // Update table data to show/hide based on sell_qty
    this.updateDataSource();
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
      const idx = this.products.findIndex((p) => p === this.editingProduct);
      if (idx !== -1) {
        this.productsService.updateProduct(idx, product);
      }
      this.showForm = false;
      this.editingProduct = null;
    }
    
    this.loadProducts();
    this.productForm.reset({ price: 0, stockQty: 0 });
  }

  cancelNewRow(): void {
    this.addingRow = false;
    this.loadProducts();
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
      this.loadProducts();
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
