import { Component, Input, OnInit, OnDestroy } from '@angular/core';

export interface CarouselSlide {
  image: string;
  title: string;
}

@Component({
  selector: 'app-carrosel',
  standalone: true,
  imports: [],
  templateUrl: './carrosel.html',
  styleUrl: './carrosel.css',
})
export class Carrosel implements OnInit, OnDestroy {
  @Input() slides: CarouselSlide[] = [];
  currentIndex: number = 0;
  private intervalId: any;

  ngOnInit(): void {
    if (this.slides.length > 0) {
      this.intervalId = setInterval(() => {
        this.next();
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
  }
}