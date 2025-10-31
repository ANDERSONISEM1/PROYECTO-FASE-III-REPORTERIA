import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-edge-check',
  template: `
    <div class="edge-wrap" role="status" aria-live="polite">
      <main class="edge-card">
        <h2 class="edge-title">Verifying you are human.</h2>
        <p class="edge-sub">This may take a few seconds.</p>

        <div class="loader"></div>
        <span class="verifying-text">Verifying…</span>
      </main>
    </div>
  `,
  styles: [`
    :root {
      --bg: #0b0f1a;
      --text: #dfe6f0;
      --muted: #a2b4cc;
      --accent: #2894ff;
    }

    .edge-wrap {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      display: grid;
      place-items: center;
      text-align: center;
      padding: 24px;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }

    .edge-card {
      max-width: 480px;
    }

    .edge-title {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }

    .edge-sub {
      margin: 8px 0 28px;
      color: var(--muted);
      font-size: 16px;
    }

    .loader {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: var(--accent);
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }

    .verifying-text {
      font-size: 15px;
      color: var(--muted);
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .edge-title { font-size: 24px; }
      .edge-sub { font-size: 15px; }
    }
  `]
})
export class EdgeCheckComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const to = this.route.snapshot.queryParamMap.get('to');
    if (to) {
      // pequeña espera antes de redirigir
      setTimeout(() => { window.location.replace(to); }, 100);
    }
  }
}
