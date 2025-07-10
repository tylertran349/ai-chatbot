// src/app/latex.ts

import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';
import * as katex from 'katex';
import { marked } from 'marked'; // <-- IMPORT MARKED

@Directive({
  selector: '[appLatex]',
  standalone: true
})
export class LatexDirective implements OnChanges {
  @Input('appLatex') content: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && typeof this.content === 'string') {
      this.render();
    }
  }

  private render(): void {
    const latexRegex = /(\$\$.*?\$\$|\$.*?\$)/g;
    const parts = this.content.split(latexRegex);

    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', ''); // Clear previous content

    parts.forEach(part => {
      if (part.match(latexRegex)) {
        // This is a LaTeX part
        const isDisplayMode = part.startsWith('$$');
        const latex = part.substring(isDisplayMode ? 2 : 1, part.length - (isDisplayMode ? 2 : 1));
        
        try {
          const html = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: isDisplayMode
          });
          const span = this.renderer.createElement('span');
          this.renderer.setProperty(span, 'innerHTML', html);
          this.renderer.appendChild(this.el.nativeElement, span);
        } catch (e) {
          console.error('KaTeX rendering error:', e);
          const textNode = this.renderer.createText(part);
          this.renderer.appendChild(this.el.nativeElement, textNode);
        }
      } else if (part) {
        // This is a Markdown/text part
        const parsedHtml = marked.parse(part) as string;
        const span = this.renderer.createElement('span');
        this.renderer.setProperty(span, 'innerHTML', parsedHtml);
        this.renderer.appendChild(this.el.nativeElement, span);
      }
    });
  }
}