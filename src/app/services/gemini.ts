// src/app/services/gemini.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor(private http: HttpClient) {}

  /**
   * Generates a standard content response based on a prompt.
   * @param apiKey The user's API key.
   * @param modelName The AI model to use.
   * @param prompt The user's prompt.
   */
  generateContent(apiKey: string, modelName: string, prompt: string): Observable<string> {
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    return this.makeRequest(apiKey, modelName, requestBody);
  }

  /**
   * Generates a short title for a new conversation.
   * @param apiKey The user's API key.
   * @param modelName The AI model to use.
   * @param firstPrompt The user's first prompt in a conversation.
   * @param firstResponse The AI's first response.
   */
  generateTitle(apiKey: string, modelName: string, firstPrompt: string, firstResponse: string): Observable<string> {
    const titlePrompt = `Summarize the following exchange in 5 words or less, as a concise title. Do not use quotes.

    User: "${firstPrompt}"
    AI: "${firstResponse}"

    Title:`;
    
    const requestBody = {
      contents: [{ parts: [{ text: titlePrompt }] }],
    };
    return this.makeRequest(apiKey, modelName, requestBody);
  }
  
  /**
   * A private helper method to handle the actual HTTP POST request and response mapping.
   * @param apiKey The user's API key.
   * @param modelName The AI model to use.
   * @param requestBody The body of the POST request.
   */
  private makeRequest(apiKey: string, modelName: string, requestBody: any): Observable<string> {
    if (!apiKey) {
      return throwError(() => new Error('API Key is missing. Please set it in the settings.'));
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    requestBody.safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ];

    return this.http.post<any>(apiUrl, requestBody).pipe(
      map(response => {
        if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return response.candidates[0].content.parts[0].text;
        }
        console.warn('AI response was valid but contained no text content.', response);
        return 'The AI returned an empty or blocked response.';
      })
    );
  }
}