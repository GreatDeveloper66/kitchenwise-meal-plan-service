# kitchenwise-meal-plan-service

A microservice that generates personalized meal plans using the OpenAI API. Part of the KitchenWise application — a full-stack microservice architecture for personalized meal planning and local grocery store discovery.

---

## Overview

This service receives a user's dietary profile and generates a fully structured meal plan using OpenAI's API. It acts as the intelligence layer of the application — translating raw dietary preferences and health data into actionable, day-by-day meal recommendations complete with nutritional information.

---

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express
- **AI Integration:** OpenAI API

---

## Features

- Generates personalized meal plans based on user dietary profiles
- Structures meal plans with daily meals and nutritional breakdowns
- Supports multiple diet types including keto, vegan, vegetarian, and high protein
- Budget-aware meal plan generation

---

## API Endpoints

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| POST | `/api/test-gpt` | Test GPT route |
| POST | `/api/test-dalle` | Test Dalle route |
| POST | `/api/meal-plan` | Call OpenAI to get comprehensive meal plan based on nutritional profile |
| POST | `/api/meal-plan-images` | Call OpenAI to get AI images for each meal in meal plan |
| POST | `/api/meal-plan-with-price` | Call OpenAI to get AI meal plan with prices |

app.post('/api/test-gpt', testGPT);
app.post('/api/test-dalle', testDalle);
app.post('/api/meal-plan', getMealPlanFromDietaryProfile);
app.post('/api/meal-plan-images', getMealPlanImages);
app.post('/api/meal-plan-with-price')
---

## Meal Plan Response Schema

```typescript
{
  id: string
  date: string
  meals: [
    {
      id: string
      name: string
      foods: [
        {
          id: string
          name: string
          calories: number
          protein: number
          carbs: number
          fat: number
          quantity: string
        }
      ]
    }
  ]
}
```

---

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
PORT=3003
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- OpenAI API key

### Installation

```bash
git clone https://github.com/GreatDeveloper66/kitchenwise-meal-plan-service.git
cd kitchenwise-meal-plan-service
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

---

## Project Architecture

This repository is one of seven components in the KitchenWise application (six backend microservices plus the React frontend):

| Repository | Responsibility |
|---------|---------------|
| [kitchenwise-frontend](https://github.com/GreatDeveloper66/kitchenwise-frontend) | React + TypeScript frontend |
| [user-auth-service](https://github.com/GreatDeveloper66/user-auth-service) | Authentication & JWT management |
| [kitchenwise-diet-profile-service](https://github.com/GreatDeveloper66/kitchenwise-diet-profile-service) | Diet profile storage & management |
| **[kitchenwise-meal-plan-service](https://github.com/GreatDeveloper66/kitchenwise-meal-plan-service)** | AI-powered meal plan generation |
| [kitchenwise-plan-storage-service](https://github.com/GreatDeveloper66/kitchenwise-plan-storage-service) | User meal plan storage |
| [kitchenwise-grocery-service](https://github.com/GreatDeveloper66/kitchenwise-grocery-service) | Grocery store discovery by location (Google Places) |
| [kitchenwise-recipe-service](https://github.com/GreatDeveloper66/kitchenwise-recipe-service) | AI recipe generation |

## LICENSE

MIT LICENSE
