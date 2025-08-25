import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';


@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {
  title = 'Biller';
  menuItems = [
    { label: 'Home', route: '/home', icon: 'home' },
    { label: 'Products', route: '/products', icon: 'inventory_2' },
    { label: 'Reports', route: '/reports', icon: 'bar_chart' },
    { label: 'Users', route: '/users', icon: 'people' },
    { label: 'Setting', route: '/setting', icon: 'settings' }
  ];
  collapsed = false;
  sidenavToggleActive = false;
  constructor(private authService: AuthService, private router: Router) {}
  toggleSidenav() {
    this.collapsed = !this.collapsed;
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
