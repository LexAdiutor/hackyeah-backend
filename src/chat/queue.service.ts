import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

@Injectable()
export class QueueService {
  private jobQueue$ = new Subject<() => Promise<void>>();

  constructor() {
    this.jobQueue$
      .pipe(concatMap(job => job()))  // Wykonuj jedno zadanie po drugim
      .subscribe({
        error: (err) => console.error('Błąd w zadaniu:', err),
      });
  }

  addJob(job: () => Promise<void>) {
    this.jobQueue$.next(job);  // Dodaj zadanie do kolejki
  }
}