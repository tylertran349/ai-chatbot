// src/app/app.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { GeminiService } from '../services/gemini';
import { Conversation, ChatMessage } from '../models/conversation.model';
import { LatexDirective } from './latex';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LatexDirective],
  providers: [GeminiService],
  templateUrl: './app.html',
  styleUrl: '../styles/app.css'
})
export class AppComponent implements OnInit {
  // --- App State ---
  prompt: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  
  // Conversation State
  conversations: Conversation[] = [];
  activeConversationId: string | null = null;

  // Settings State
  apiKey: string = '';
  selectedModel: string = '';
  availableModels: string[] = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ];
  
  // Modal State
  isApiKeyModalVisible: boolean = false;
  isConfirmDeleteModalVisible: boolean = false;
  tempApiKey: string = '';
  conversationToDeleteId: string | 'all' | null = null;

  // --- UPDATED: Local Storage Keys ---
  private readonly STORAGE_KEY_CONVOS = 'ai-chatbot-conversations';
  private readonly STORAGE_KEY_API_KEY = 'ai-chatbot-api-key';
  private readonly STORAGE_KEY_MODEL = 'ai-chatbot-model';

  constructor(private geminiService: GeminiService) {}

  ngOnInit(): void {
    this.loadApiKey();
    this.loadSelectedModel();
    this.loadConversations();
    if(!this.apiKey){
      this.isApiKeyModalVisible = true;
    }
  }

  // --- Core Methods ---
  askAI(): void {
    if (!this.prompt.trim() || this.isLoading || !this.apiKey) {
      if (!this.apiKey) this.error = "API Key is not set. Please add it in the settings.";
      return;
    }

    this.isLoading = true;
    this.error = null;
    const userMessage: ChatMessage = { role: 'user', content: this.prompt };
    const currentPrompt = this.prompt;
    this.prompt = '';

    if (this.activeConversationId) {
      this.continueConversation(this.activeConversationId, userMessage, currentPrompt);
    } else {
      this.createNewConversation(userMessage, currentPrompt);
    }
  }

  handleEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    
    if (keyboardEvent.shiftKey) {
      return; 
    }
    keyboardEvent.preventDefault();
    this.askAI();
  }

  private continueConversation(convoId: string, userMessage: ChatMessage, promptText: string): void {
    const conversation = this.conversations.find(c => c.id === convoId)!;
    conversation.messages.push(userMessage);
    
    this.geminiService.generateContent(this.apiKey, this.selectedModel, promptText).subscribe({
      next: (aiResponse) => {
        conversation.messages.push({ role: 'ai', content: aiResponse });
        this.isLoading = false;
        this.saveConversations();
      },
      error: (err) => this.handleError(err)
    });
  }

  private createNewConversation(userMessage: ChatMessage, promptText: string): void {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat...',
      messages: [userMessage]
    };
    this.conversations.unshift(newConversation);
    this.activeConversationId = newConversation.id;
    this.geminiService.generateContent(this.apiKey, this.selectedModel, promptText).subscribe({
      next: (aiResponse) => {
        newConversation.messages.push({ role: 'ai', content: aiResponse });
        this.isLoading = false;
        this.saveConversations();
        this.generateTitleForConversation(newConversation, promptText, aiResponse);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private generateTitleForConversation(convo: Conversation, prompt: string, response: string): void {
    this.geminiService.generateTitle(this.apiKey, this.selectedModel, prompt, response).subscribe(title => {
      convo.title = title.trim().replace(/["']/g, "");
      this.saveConversations();
    });
  }

  selectConversation(id: string): void {
    this.activeConversationId = id;
  }

  startNewConversation(): void {
    this.activeConversationId = null;
    this.prompt = '';
    this.error = null;
  }

  getActiveConversation(): Conversation | undefined {
    return this.conversations.find(c => c.id === this.activeConversationId);
  }

  // --- Deletion Confirmation Flow ---
  requestDeleteConversation(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.conversationToDeleteId = id;
    this.isConfirmDeleteModalVisible = true;
  }

  requestClearAll(): void {
    if (this.conversations.length === 0) return;
    this.conversationToDeleteId = 'all';
    this.isConfirmDeleteModalVisible = true;
  }

  confirmDeletion(): void {
    if (this.conversationToDeleteId === 'all') {
      this.conversations = [];
      this.activeConversationId = null;
    } else if (this.conversationToDeleteId) {
      this.conversations = this.conversations.filter(c => c.id !== this.conversationToDeleteId);
      if (this.activeConversationId === this.conversationToDeleteId) {
        this.activeConversationId = null;
      }
    }
    this.saveConversations();
    this.cancelDeletion();
  }

  cancelDeletion(): void {
    this.isConfirmDeleteModalVisible = false;
    this.conversationToDeleteId = null;
  }

  getConfirmDeleteMessage(): string {
    if (this.conversationToDeleteId === 'all') {
      return 'Are you sure you want to delete all conversations? This action cannot be undone.';
    }
    const convo = this.conversations.find(c => c.id === this.conversationToDeleteId);
    return `Are you sure you want to delete the conversation titled "${convo?.title}"?`;
  }

  // --- Settings & Persistence ---
  showApiKeyModal(): void {
    this.tempApiKey = this.apiKey;
    this.isApiKeyModalVisible = true;
  }
  
  saveApiKey(): void {
    this.apiKey = this.tempApiKey;
    localStorage.setItem(this.STORAGE_KEY_API_KEY, this.apiKey);
    this.isApiKeyModalVisible = false;
    this.error = null;
  }

  onModelChange(): void {
    localStorage.setItem(this.STORAGE_KEY_MODEL, this.selectedModel);
  }
  
  private loadApiKey(): void {
    this.apiKey = localStorage.getItem(this.STORAGE_KEY_API_KEY) || '';
  }

  private loadSelectedModel(): void {
    this.selectedModel = localStorage.getItem(this.STORAGE_KEY_MODEL) || 'gemini-2.5-flash';
  }
  
  private saveConversations(): void {
    localStorage.setItem(this.STORAGE_KEY_CONVOS, JSON.stringify(this.conversations));
  }

  private loadConversations(): void {
    const savedData = localStorage.getItem(this.STORAGE_KEY_CONVOS);
    if (savedData) {
      this.conversations = JSON.parse(savedData);
    }
  }
  
  private handleError(error: any): void {
    console.error(error);
    this.error = error.message || 'An unknown error occurred. Check the console for details.';
    this.isLoading = false;
  }
}