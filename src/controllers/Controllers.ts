import dotenv from 'dotenv';
dotenv.config();
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import OpenAI from 'openai';
import { Request, Response } from 'express';
import { ApiResponse, TestGPTRequest, TestDalleRequest, TestGPTResponse, TestDalleResponse } from '../data_types/index.js';
import { DietaryProfile, MealPlan, MealPlanImages, MealPlanWithPrice, Meal, FoodItem, BUDGET_LEVELS } from '../data_types/index.js';
import { generateMealPlan, generateMealPlanWithPrice } from '../helpers/helpers.js'; // Add .js extension
// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const testGPT = async (req: TestGPTRequest, res: TestGPTResponse): Promise<void> => {
  const { prompt } = req.body;
  try {
    const response = await generateText({
      model: openai('gpt-4o'),
      prompt: prompt || 'Hello, world! This is a test of the GPT endpoint.',
    });
    res.status(200).json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ text: 'An error occurred while processing the GPT request.' });
  }
};


export const testDalle = async (req: TestDalleRequest, res: TestDalleResponse): Promise<void> => {
  const { prompt } = req.body;

  try {
    const response = await openaiClient.images.generate({
      model: "dall-e-3",
      prompt: prompt || 'A healthy meal prep with vegetables and grains',
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      res.status(500).json({
        error: 'Failed to generate image: no URL returned'
      });
      return;
    }
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Function to generate meal plan based on dietary profile. Input DietaryProfile, output MealPlan



export const getMealPlanFromDietaryProfile = async (req: Request<{}, {}, DietaryProfile>, res: Response<ApiResponse<MealPlan>>): Promise<void> => {
  if (!isValidDietaryProfile(req.body)) {
    res.status(400).json({
      success: false,
      error: 'Invalid request body. Expected a valid DietaryProfile object.'
    });
    return;
  }

  const profile = req.body;

  try {
    const mealPlan = await generateMealPlan(profile);

    if (!mealPlan || !Array.isArray(mealPlan.meals) || mealPlan.meals.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No meal plan could be generated from the AI response.'
      });
      return;
    }

    res.status(200).json({ success: true, data: mealPlan });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error while generating meal plan.'
    });
  }
};

export const getMealPlanWithPriceFromDietaryProfile = async (req: Request<{}, {}, DietaryProfile>, res: Response<ApiResponse<MealPlanWithPrice>>): Promise<void> => {
  if (!isValidDietaryProfile(req.body)) {
    res.status(400).json({
      success: false,
      error: 'Invalid request body. Expected a valid DietaryProfile object.'
    });
    return;
  } else {
    const profile = req.body;
    try {
      const mealPlanWithPrice = await generateMealPlanWithPrice(profile);
      if (!mealPlanWithPrice || !Array.isArray(mealPlanWithPrice.meals) || mealPlanWithPrice.meals.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No meal plan with price could be generated from the AI response.'
        });
        return;
      }
      res.status(200).json({ success: true, data: mealPlanWithPrice });
    }
    catch (error) {
      console.error('Meal plan with price generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown server error while generating meal plan with price.'
      });
    }
  }
};


export const getMealPlanImages = async (req: Request<{}, {}, MealPlan>, res: Response<ApiResponse<MealPlanImages>>): Promise<void> => {
  const mealPlan = req.body;

  if (!isMealPlan(mealPlan)) {
    res.status(400).json({
      success: false,
      error: 'Invalid request body. Expected a MealPlan object with a valid meals array and proper food items.'
    });
    return;
  }

  try {
    // Generate all meal images in parallel; Promise.all keeps the URLs in meal order.
    const imageUrls = await Promise.all(mealPlan.meals.map(async (meal) => {
      try {
        return await generateMealImageUrl(meal);
      } catch (error) {
        throw new Error(`Failed to generate image for meal ${meal.name}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
    }));

    const mealPlanImages: MealPlanImages = {
      MealPlanImagesUrls: imageUrls.map((url) => ({ mealImageUrl: url }))
    };
    res.status(200).json({ success: true, data: mealPlanImages });
  } catch (error) {
    // Any failed meal fails the whole request, with exactly one response sent.
    console.error(error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
}

// Returns a short-lived (about 1 hour) DALL-E image URL for one meal. Throws on failure.
const generateMealImageUrl = async (meal: Meal): Promise<string> => {
  const prompt = `Generate an image for the following meal: ${meal.name}. The meal consists of the following foods: ${meal.foods.map(food => food.name).join(', ')}. Please generate a visually appealing image that represents this meal.`;
  const response = await openaiClient.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    response_format: "url",
  });
  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('no URL returned');
  }
  if (!isValidImageUrl(imageUrl)) {
    throw new Error('returned URL is not a valid https URL');
  }
  return imageUrl;
};


const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isFoodItem = (value: unknown): value is FoodItem => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.calories === 'number' &&
    typeof value.protein === 'number' &&
    typeof value.carbs === 'number' &&
    typeof value.fat === 'number' &&
    (typeof value.quantity === 'undefined' || typeof value.quantity === 'string')
  );
};

const isMeal = (value: unknown): value is Meal => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (value.name === 'breakfast' || value.name === 'lunch' || value.name === 'dinner') &&
    Array.isArray(value.foods) &&
    value.foods.every(isFoodItem)
  );
};

const isMealPlan = (value: unknown): value is MealPlan => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    Array.isArray(value.meals) &&
    value.meals.every(isMeal)
  );
};

// DALL-E URLs are signed blob URLs ending in a query string (e.g. ...img-abc.png?st=...&sig=...),
// so check that it parses as https rather than matching a file extension.
const isValidImageUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};


const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

const isValidDietaryProfile = (body: unknown): body is DietaryProfile => {
  if (typeof body !== 'object' || body === null) return false;
  const candidate = body as Record<string, unknown>;
  const allowedSex = ['male', 'female', 'other'];
  const allowedActivity = ['sedentary', 'light', 'moderate', 'active', 'very active'];
  const allowedBudget: readonly string[] = BUDGET_LEVELS;

  return (
    typeof candidate.age === 'number' &&
    allowedSex.includes(candidate.sex as string) &&
    typeof candidate.weight === 'number' &&
    typeof candidate.height === 'number' &&
    allowedActivity.includes(candidate.activityLevel as string) &&
    isStringArray(candidate.dietaryPreferences) &&
    allowedBudget.includes(candidate.budgetLevel as string)
  );
};