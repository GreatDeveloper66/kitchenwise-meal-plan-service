# kitchenwise-meal-plan-service

Generates meal plans from a diet profile using the OpenAI API. Branch: `main`. Deployed at https://ai-meal-planner-backend.vercel.app (old name, do not rename).

Stack: Node.js 26.x (`engines` in `package.json`; Vercel dropped 20.x), Express, TypeScript, OpenAI (`gpt-4o` via the Vercel AI SDK, DALL-E 3 via the `openai` client). Routes in `src/server.ts`, handlers and validators in `src/controllers/Controllers.ts`, prompts in `src/helpers/helpers.ts`, types in `src/data_types/index.ts`.

## Routes (no auth)

| Method | Route | Body | `data` on success |
|---|---|---|---|
| GET | / | — | (plain text "Meal Planner API is running") |
| POST | /api/meal-plan | diet profile | `MealPlan` |
| POST | /api/meal-plan-with-price | diet profile | `MealPlanWithPrice` (21 meals, `price` per meal) |
| POST | /api/meal-plan-images | `MealPlan` | `{ MealPlanImagesUrls: [{ mealImageUrl }] }` |
| POST | /api/test-gpt | `{ prompt? }` | not enveloped: `{ text }` |
| POST | /api/test-dalle | `{ prompt? }` | not enveloped: `{ imageUrl }` or `{ error }` |

There is no `/api/health` route.

Diet profile body: `age`, `sex` (`male|female|other`), `weight` (kg), `height` (cm), `activityLevel` (`sedentary|light|moderate|active|very active`), `dietaryPreferences` (string array), `budgetLevel` (`Minimal|Normal|Premium`, `BUDGET_LEVELS` in `src/data_types/index.ts`). These match kitchenwise-diet-profile-service's model, so a stored profile can be posted as-is; keep the two in step.

**Response envelope:** the meal plan and image routes return `{ success: true, data }` or `{ success: false, error }` (400 invalid body, 404 no usable AI output, 500 failure). `MealPlan` is `{ id, date, meals: [{ id, name: breakfast|lunch|dinner, foods: [{ id, name, calories, protein, carbs, fat, quantity? }] }] }`. Callers must unwrap `data` before posting to `/api/meal-plan-images`, kitchenwise-plan-storage-service, or kitchenwise-recipe-service.

Env: `OPENAI_API_KEY`, optional `PORT` (default 3000). No `JWT_SECRET`; this service has no auth.

## Known issues

- `/api/meal-plan-images` was fixed (it used to reject every image) but has not been tested with a real OpenAI key. Images are generated in parallel, one per meal, so a 21-meal plan may hit DALL-E rate limits. URLs expire after about an hour; don't store them. Remove this note after a real call works.
- No CORS middleware, so browser calls from the frontend will be blocked.
- `test-gpt` returns `{ text }` on errors too, instead of `{ error }`.
- `/api/meal-plan-with-price` asks the model for `totalPrice`, but the type and validation ignore it.

## Rules

- The response shape is consumed by kitchenwise-plan-storage-service and the frontend, and its meals feed kitchenwise-recipe-service. Treat changes to it as cross-repo changes.
- Never hardcode or log `OPENAI_API_KEY`.
