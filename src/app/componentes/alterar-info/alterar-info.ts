import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-alterar-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alterar-info.html',
  styleUrl: './alterar-info.css'
})
export class AlterarInfoComponent {

  @Input({ required: true }) label!: string;
  @Input({ required: true }) valor!: string | number;
  @Input() temInfo: boolean = true;
  @Input() editavel: boolean = true;
  @Input() tipoInput: 'numero' | 'texto' = 'numero';

  @Output() valorChange = new EventEmitter<string | number>();
  @Output() infoClick = new EventEmitter<void>();

  editando: boolean = false;
  
  numeroEditavel: number | null = null;
  prefixo: string = '';
  sufixo: string = '';
  valorTexto: string = '';

  
  iniciarEdicao(): void {
    if (!this.editavel) return;

    const valStr = String(this.valor).trim();

    if (this.tipoInput === 'texto') {
      this.valorTexto = valStr;
    } else {
      const match = valStr.match(/^([^\d]*)(\d+(?:[.,]\d+)?)\s*(.*)$/);

      if (match) {
        this.prefixo = match[1];
        this.numeroEditavel = Number(match[2].replace(',', '.'));
        this.sufixo = match[3];
      } else {
        this.prefixo = '';
        this.numeroEditavel = null;
        this.sufixo = '';
      }
    }

    this.editando = true;
  }


  
  salvar(): void {
    let novoValor: string | number;

    if (this.tipoInput === 'texto') {
      novoValor = this.valorTexto.trim();

      if (!novoValor) {
        alert('Por favor, preencha o campo.');
        return;
      }
    } else {
      if (
        this.numeroEditavel === null ||
        !Number.isFinite(this.numeroEditavel) ||
        this.numeroEditavel < 0
      ) {
        alert('Por favor, insira um número válido.');
        return;
      }

      if (typeof this.valor === 'number' && !this.prefixo && !this.sufixo) {
        novoValor = this.numeroEditavel;
      } else {
        novoValor = `${this.prefixo}${this.numeroEditavel}${this.sufixo}`;
      }
    }

    this.editando = false;
    this.valorChange.emit(novoValor);
  }


  cancelar(): void {
    this.editando = false;
  }
}