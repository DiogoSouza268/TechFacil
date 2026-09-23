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

  @Output() valorChange = new EventEmitter<any>();
  @Output() infoClick = new EventEmitter<void>();

  editando: boolean = false;
  valorTemporario: string | number = '';

  iniciarEdicao(): void {
    this.valorTemporario = this.valor;
    this.editando = true;
  }

  salvar(): void {
    this.editando = false;
    this.valorChange.emit(this.valorTemporario);
  }

  cancelar(): void {
    this.editando = false;
  }
}