import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-content">
        <p>© 2025 Universidad Católica de Manizales. Todos los derechos reservados.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #003366;
      color: white;
      padding: 0.5rem 1rem;
      text-align: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      position: fixed;
      bottom: 0;
      width: 100%;
      z-index: 1000;
      left: 0;
    }
    .footer-content a {
      color: #ffd600;
      text-decoration: none;
      font-weight: 600;
    }
    .footer-content a:hover {
      text-decoration: underline;
    }
  `]
})
export class FooterComponent {}
