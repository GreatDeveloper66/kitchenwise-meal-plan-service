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
- **AI Integration:** OpenAI API (`gpt-4o` for text via the Vercel AI SDK, DALL-E 3 for images)

---

## Features

- Generates personalized meal plans based on a diet profile
- Meal plans with an estimated price per meal (7 breakfasts, 7 lunches, 7 dinners)
- Supports diet preferences such as Keto, Vegan, Vegetarian, and High Protein
- Budget-aware meal plan generation
- AI-generated images for each meal

---

## API Endpoints

No authentication is required. All routes accept and return JSON.

| Method | Endpoint | Body | Description |
| -------- | ---------- | ---- | ------------- |
| GET | `/` | — | Returns the text "Meal Planner API is running" |
| POST | `/api/meal-plan` | Diet profile | Generate a meal plan |
| POST | `/api/meal-plan-with-price` | Diet profile | Generate a 21-meal plan with a price on each meal |
| POST | `/api/meal-plan-images` | Meal plan | Generate one image per meal |
| POST | `/api/test-gpt` | `{ "prompt": string }` (optional) | Test the OpenAI text connection |
| POST | `/api/test-dalle` | `{ "prompt": string }` (optional) | Test the DALL-E connection |

---

## Request Schema: Diet Profile

Used by `/api/meal-plan` and `/api/meal-plan-with-price`. It matches the profile stored by kitchenwise-diet-profile-service, so a stored profile can be posted as-is. Enum values are case-sensitive.

```typescript
{
  age: number
  sex: "male" | "female" | "other"
  weight: number   // kg
  height: number   // cm
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very active"
  dietaryPreferences: string[]   // e.g. ["Vegetarian"]
  budgetLevel: "Minimal" | "Normal" | "Premium"
}
```

---

## Response Envelope

Every meal plan and image route wraps its result:

```typescript
// success
{ success: true, data: <result> }
// failure (400 invalid body, 404 no usable AI output, 500 OpenAI or server error)
{ success: false, error: string }
```

Unwrap `data` before passing a meal plan to `/api/meal-plan-images`, kitchenwise-plan-storage-service, or kitchenwise-recipe-service.

## Meal Plan Schema

`data` for `/api/meal-plan`, and the request body for `/api/meal-plan-images`:

```typescript
{
  id: string
  date: string
  meals: {
    id: string
    name: "breakfast" | "lunch" | "dinner"
    foods: {
      id: string
      name: string
      calories: number
      protein: number
      carbs: number
      fat: number
      quantity?: string
    }[]
  }[]
}
```

`/api/meal-plan-with-price` returns the same shape with a `price: number` on each meal. The prompt also asks the model for a top-level `totalPrice`, which may be present but is not validated.

## Meal Plan Images Schema

`data` for `/api/meal-plan-images`, one entry per meal in the same order as `meals`:

```typescript
{
  MealPlanImagesUrls: { mealImageUrl: string }[]
}
```

The URLs are temporary DALL-E links that expire after about an hour. Display them; don't store them. If any image fails, the whole request returns 500.

The test routes return `{ text }` (`/api/test-gpt`) and `{ imageUrl }` or `{ error }` (`/api/test-dalle`). They do not use the envelope.

---

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=3000   # optional, defaults to 3000
```

This service does not verify JWTs, so it does not need `JWT_SECRET`.

---

## Getting Started

### Prerequisites

- Node.js 26.x (pinned in `package.json` `engines` for Vercel)
- OpenAI API key

### Installation

```bash
git clone https://github.com/GreatDeveloper66/kitchenwise-meal-plan-service.git
cd kitchenwise-meal-plan-service
npm install
```

### Development

```bash
npm run dev    # tsx watch on src/server.ts, http://localhost:3000
```

### Production

```bash
npm run build  # tsc to dist/
npm start      # node dist/server.js
```

The service does not enable CORS, so a browser app on another origin cannot call it directly yet.

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
