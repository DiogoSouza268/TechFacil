import { Component } from '@angular/core';
import { Menu } from '../../componentes/menu/menu';
import { CarouselSlide , Carrosel} from '../../componentes/carrosel/carrosel';

@Component({
  selector: 'app-home',
  imports: [Menu, Carrosel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  homeCarosel: CarouselSlide[] = [
    {
      image: "/img/celulares.jpg",
      title: 'Bateria para até 2 dias fora da tomada! Veja aparelhos com alta duração.'
    },
    {
      image: "/img/familia-unida.jpg",
      title: 'Chega de memória cheia: celulares com 128GB ou mais para guardar suas fotos.'
    },
    {
      image: "/img/hardware_smartphone.jpg",
      title: 'Não sabe qual escolher? Use o filtro de prioridades abaixo que nós ajudamos!'
    }
  ];

}
