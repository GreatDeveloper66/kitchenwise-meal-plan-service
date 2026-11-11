# kitchenwise-meal-plan-service

Generates meal plans from a diet profile using the OpenAI API. Branch: `main`. Deployed at https://ai-meal-planner-backend.vercel.app (old name, do not rename).

Stack: Node.js, Express, TypeScript, OpenAI API.

## Routes (as tested in Postman, no auth header used)

| Method | Route | Purpose |
|---|---|---|
| POST | /api/test-gpt | Test prompt (`{ "prompt": string }`) |
| POST | /api/test-dalle | Test image prompt |
| POST | /api/meal-plan | Meal plan from a diet profile |
| POST | /api/meal-plan-images | Images for each meal in a meal plan |
| POST | /api/meal-plan-with-price | Meal plan with prices |

`/api/meal-plan` and `/api/meal-plan-with-price` body: `age`, `sex`, `weight`, `height`, `activityLevel`, `dietaryPreferences` (array), `budgetLevel`. These are the diet profile fields from kitchenwise-diet-profile-service, so a stored profile can be posted as-is. `budgetLevel` is `Minimal | Normal | Premium` (`BUDGET_LEVELS` in `src/data_types/index.ts`), matching the diet profile model; keep the two in step.

Response shape: `{ id, date, meals: [{ id, name, foods: [{ id, name, calories, protein, carbs, fat, quantity }] }] }`. `/api/meal-plan-images` takes that same shape as its body.

## Known issues

- Image retrieval (`/api/meal-plan-images`) needs debugging.
- README endpoint table is followed by stray `app.post(...)` code lines; clean up when touching the README.
- README says `PORT=3003`; local default in practice is 3000.

## Rules

- The response shape is consumed by kitchenwise-plan-storage-service and the frontend, and its meals feed kitchenwise-recipe-service. Treat changes to it as cross-repo changes.
- Never hardcode or log `OPENAI_API_KEY`.
