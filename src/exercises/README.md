# Exercises

This directory contains all math exercises for the application.

## Adding a New Exercise

To add a new exercise:

1. **Create a new file** in this directory (e.g., `MyNewExercise.tsx`)
2. **Export a default component** with your exercise logic
3. **Add a route** in `src/App.tsx`:

```tsx
import MyNewExercise from "./exercises/MyNewExercise";

// In the Routes component:
<Route path="/my-new-exercise" element={<MyNewExercise />} />
```

## Example Structure

```tsx
export default function MyNewExercise() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Your exercise UI here */}
    </div>
  );
}
```

## Available Routes

- `/` - Default (Zahlenpyramide)
- `/zahlenpyramide` - Number Pyramid Exercise
- `/example-exercise` - Example placeholder exercise

## Styling

All exercises use Tailwind CSS classes. The gradient background theme is:
```
bg-gradient-to-br from-sky-50 via-pink-50 to-emerald-50
```
