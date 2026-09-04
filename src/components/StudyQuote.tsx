"use client";

import { useEffect, useState } from "react";

const quotes = [
  "Small progress is still progress.",
  "Discipline turns study time into real growth.",
  "Focus on the next page, the next problem, the next step.",
  "A little effort every day builds remarkable results.",
  "You do not need to be perfect. You only need to keep going.",
  "Consistency is the quiet power behind every achievement.",
  "The future is built by what you practice today.",
  "Study with patience. Improve with purpose.",
  "One focused session can change the direction of your day.",
  "Hard work becomes easier when it becomes a habit.",
  "Progress grows where attention goes.",
  "Do the work today that your future self will thank you for.",
  "Learning is a journey made of ordinary days.",
  "Stay curious, stay patient, stay consistent.",
  "Your effort is adding up, even when the results are not visible yet.",
];

export default function StudyQuote() {
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <p className="mt-8 max-w-xl px-6 text-center text-sm italic text-neutral-500 sm:mt-12 sm:text-base">
      &ldquo;{quote}&rdquo;
    </p>
  );
}