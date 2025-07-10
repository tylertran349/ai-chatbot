// src/app/app.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Import our new service (using the correct path)
import { GeminiService } from './services/gemini';

interface Conversation {
  prompt: string;
  response: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  // IMPORTANT: Add GeminiService to the providers array
  providers: [GeminiService],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class AppComponent {
  prompt: string = '';
  isLoading: boolean = false;
  aiResponse: string | null = null;
  error: string | null = null;

  conversationHistory: Conversation[] = [];

  constructor(private geminiService: GeminiService) {} // Inject the GeminiService in the constructor

  askAI() {
    if (!this.prompt) return;

    this.isLoading = true;
    this.error = null;
    const currentPrompt = this.prompt; // Save the prompt before clearing it

    this.geminiService.generateContent(currentPrompt).subscribe({
      next: (response) => {
        // Push the new conversation turn to our history array
        this.conversationHistory.push({
          prompt: currentPrompt,
          response: response
        });
        this.isLoading = false;
        this.prompt = ''; // Clear the input box for the next prompt
      },
      error: (err) => {
        console.error(err);
        this.error = 'Sorry, something went wrong. Please check the API key and try again.';
        this.isLoading = false;
      }
    });
  }

  // Add a new method to clear the history
  clearHistory() {
    this.conversationHistory = [];
  }
}