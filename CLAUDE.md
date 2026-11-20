# kitchenwise-meal-plan-service

Generates meal plans from a diet profile using the OpenAI API. Branch: `main`. Deployed at https://ai-meal-planner-backend.vercel.app (old name, do not rename).

Stack: Node.js 26.x (`engines` in `package.json`; Vercel dropped 20.x), Express (with `cors()`, all origins), TypeScript, OpenAI (`gpt-4o` via the Vercel AI SDK, DALL-E 3 via the `openai` client), Vercel Blob (`@vercel/blob`) for stored meal images. Routes in `src/server.ts`, handlers and validators in `src/controllers/Controllers.ts`, prompts in `src/helpers/helpers.ts`, types in `src/data_types/index.ts`.

## Routes (no auth)

| Method | Route | Body | `data` on success |
|---|---|---|---|
| GET | / | — | (plain text "Meal Planner API is running") |
| POST | /api/meal-plan | diet profile | `MealPlan` |
| POST | /api/meal-plan-with-price | diet profile | `MealPlanWithPrice` (one day: breakfast, lunch, dinner, `price` per meal) |
| POST | /api/meal-plan-images | `MealPlan` (at most 3 meals) | `{ MealPlanImagesUrls: [{ mealImageUrl }] }`, permanent Vercel Blob URLs in meal order |
| POST | /api/test-gpt | `{ prompt? }` | not enveloped: `{ text }` |
| POST | /api/test-dalle | `{ prompt? }` | not enveloped: `{ imageUrl }` or `{ error }` |

There is no `/api/health` route.

Diet profile body: `age`, `sex` (`male|female|other`), `weight` (kg), `height` (cm), `activityLevel` (`sedentary|light|moderate|active|very active`), `dietaryPreferences` (string array), `budgetLevel` (`Minimal|Normal|Premium`, `BUDGET_LEVELS` in `src/data_types/index.ts`). These match kitchenwise-diet-profile-service's model, so a stored profile can be posted as-is; keep the two in step.

**Response envelope:** the meal plan and image routes return `{ success: true, data }` or `{ success: false, error }` (400 invalid body, 404 no usable AI output, 500 failure). `MealPlan` is `{ id, date, meals: [{ id, name: breakfast|lunch|dinner, foods: [{ id, name, calories, protein, carbs, fat, quantity? }] }] }`. Callers must unwrap `data` before posting to `/api/meal-plan-images`, kitchenwise-plan-storage-service, or kitchenwise-recipe-service.

Env: `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN` (added by Vercel when a public Blob store is connected to the project; needed for `/api/meal-plan-images`, which returns 500 without it before calling DALL-E), optional `PORT` (default 3000). No `JWT_SECRET`; this service has no auth.

## Meal images

`/api/meal-plan-images` asks DALL-E 3 for each image as base64 (`response_format: "b64_json"`), uploads it to Vercel Blob at `meal-images/<planId>/<mealId>-<meal>.png` with a random suffix, and returns the blob's public URL. DALL-E's own URLs expire after about an hour, which is why images are stored. The frontend saves these URLs in each meal's `image` field in kitchenwise-plan-storage-service. Requests with more than 3 meals get a 400, so one unauthenticated call can't run up dozens of images. Any failed image fails the whole request.

## Known issues

- `/api/meal-plan-images` with Blob storage has not been tested against real OpenAI and Blob credentials yet. Remove this note after a real call works.
- The service has no auth, so anyone who finds the URL can spend OpenAI credit and Blob storage (capped at 3 images per request).
- `test-gpt` returns `{ text }` on errors too, instead of `{ error }`.
- `/api/meal-plan-with-price` asks the model for `totalPrice`, but the type and validation ignore it.
- `/api/meal-plan` (unpriced) doesn't say how many days to plan; only the priced prompt is pinned to one day.

## Rules

- The response shape is consumed by kitchenwise-plan-storage-service and the frontend, and its meals feed kitchenwise-recipe-service. Treat changes to it as cross-repo changes.
- Never hardcode or log `OPENAI_API_KEY`.
