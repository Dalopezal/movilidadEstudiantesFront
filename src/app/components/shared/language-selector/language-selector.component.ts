import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector">
      <button
        class="btn-lang"
        [class.active]="currentLang === 'es'"
        (click)="cambiarIdioma('es')"
        title="Español"
        [disabled]="isTranslating"
      >
        🇪🇸 ES
      </button>
      <button
        class="btn-lang"
        [class.active]="currentLang === 'en'"
        (click)="cambiarIdioma('en')"
        title="English"
        [disabled]="isTranslating"
      >
        🇺🇸 EN
      </button>
    </div>

    <!-- Overlay de carga -->
    <div class="translation-overlay" *ngIf="isTranslating">
      <div class="translation-card">
        <div class="spinner"></div>
        <p class="translation-text">
          Traduciendo a <strong>{{ targetLangName }}</strong>...
        </p>
      </div>
    </div>
  `,
  styles: [`
    .language-selector {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem;
    }
    .btn-lang {
      padding: 0.4rem 0.8rem;
      border: 2px solid #0D133F;
      background: white;
      color: #0D133F;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .btn-lang:hover:not(:disabled) {
      background: #E2E6F7;
      transform: translateY(-2px);
    }
    .btn-lang.active {
      background: #0D133F;
      color: white;
    }
    .btn-lang:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Overlay de traducción */
    .translation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(13, 19, 63, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .translation-card {
      background: white;
      padding: 2.5rem 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #E2E6F7;
      border-top: 5px solid #0D133F;
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .translation-text {
      font-size: 18px;
      color: #0D133F;
      margin: 0;
      font-weight: 500;
    }

    .translation-text strong {
      color: #0D133F;
      font-weight: 700;
    }
  `]
})
export class LanguageSelectorComponent {
  currentLang: string;
  isTranslating = false;
  targetLangName = '';

  private langNames: { [key: string]: string } = {
    'es': 'Español',
    'en': 'English'
  };

  constructor(private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || 'es';

    // Escuchar cambios de idioma
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }

  cambiarIdioma(lang: string) {
    if (lang === this.currentLang || this.isTranslating) return;

    this.isTranslating = true;
    this.targetLangName = this.langNames[lang] || lang.toUpperCase();

    // Simular delay de 3 segundos
    setTimeout(() => {
      this.translate.use(lang);

      // Esperar un frame para que Angular detecte el cambio
      setTimeout(() => {
        this.isTranslating = false;
      }, 100);
    }, 2000);
  }
}
