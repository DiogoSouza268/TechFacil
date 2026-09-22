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
      image: "/img/projeto/celulares.jpg",
      title: 'Aprenda a escolher qual o melhor aparelho'
    },
    {
      image: "/img/projeto/familia-unida.jpg",
      title: 'O celular perfeito para todos os membros da familia'
    },
    {
      image: "/img/projeto/hardware_smartphone.jpg",
      title: 'Venha aprender sobre as peças de um celular'
    }
  ];

}
