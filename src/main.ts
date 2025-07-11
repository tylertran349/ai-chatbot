import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/components/app.config';
import { AppComponent } from './app/components/app';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
