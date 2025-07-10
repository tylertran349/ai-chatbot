// src/app/models/conversation.model.ts

// Represents a single message in the chat, from either the user or the AI.
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

// Represents a full conversation, including a unique ID, a title, and all its messages.
export interface Conversation {
  id: string; // A unique identifier, e.g., a timestamp
  title: string; // The AI-generated summary
  messages: ChatMessage[];
}