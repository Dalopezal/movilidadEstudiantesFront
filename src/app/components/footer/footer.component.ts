import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-left">
        <img src="../../../assets/miracle-original.svg" alt="Logo Miracle" class="footer-logo1" />
        <img src="../../../assets/logo-eu.png" alt="Logo UE" class="footer-logo" />
      </div>
      <div class="footer-center">
        <p class="footer-text fuente">© 2025 Universidad Católica de Manizales. Todos los derechos reservados.</p>
      </div>
      <div class="footer-right">
        <!-- Si quieres agregar algo a la derecha, aquí -->
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: white;
      padding: 0.5rem 1rem;
      position: fixed;
      bottom: 0;
      width: 100%;
      box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      z-index: 1000;
      left: 0;
      height: 50px;
    }
    .footer-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .footer-logo1 {
      height: 65px;
      object-fit: contain;
    }
    .footer-logo {
      height: 30px;
      object-fit: contain;
    }
    .footer-center {
      flex-grow: 1;
      text-align: center;
    }
    .footer-text {
      color: #0D133F;
      font-size: 12px;
      margin: 0;
    }
    .footer-right {
      width: 100px; /* espacio reservado si quieres */
    }
  `]
})
export class FooterComponent {}
