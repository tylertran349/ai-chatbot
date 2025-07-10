// src/app/services/gemini.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable, map, of, throwError } from 'rxjs'; // Import throwError and of

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiKey = environment.geminiApiKey;
  private apiUrl = ''; // Leave it blank for now

  constructor(private http: HttpClient) {
    // --- START DEBUGGING BLOCK ---
    console.log('--- Gemini Service Initializing ---');
    console.log('API Key loaded from environment:', this.apiKey);

    if (!this.apiKey) {
      console.error('CRITICAL: API Key is NOT LOADED. The URL will be invalid.');
      // Don't even bother setting the apiUrl if the key is missing.
    } else {
      const modelName = 'gemini-2.5-flash';
      
      // This line builds the correct URL for that model
      this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
      console.log('Constructed API URL:', this.apiUrl);
    }
    console.log('-----------------------------------');
    // --- END DEBUGGING BLOCK ---
  }

  generateContent(prompt: string): Observable<string> {
    // If the API URL was never constructed, return an error immediately.
    if (!this.apiUrl) {
      return throwError(() => new Error('API Key is missing. Cannot make request.'));
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    return this.http.post<any>(this.apiUrl, requestBody).pipe(
      map(response => {
        if (response.candidates && response.candidates.length > 0) {
          return response.candidates[0].content.parts[0].text;
        }
        throw new Error('Invalid response structure from AI');
      })
    );
  }
}