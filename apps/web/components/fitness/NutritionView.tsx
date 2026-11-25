// Nutrition, Macro Targets, Water Intake, Saved Meals & TDEE Calculator View
"use client";

import { useState, useMemo } from "react";
import {
  Barcode,
  Calculator,
  ChevronDown,
  Droplets,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useFitness } from "@/hook/fitness";
import { calculateTDEEAndMacros, toDateKey } from "@/lib/fitnessUtils";
import type { MealSlot } from "./types";

const MEAL_SLOTS: MealSlot[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export function NutritionView() {
  const {
    foodDatabase,
    foodLogs,
    savedMeals,
    nutritionTargets,
    waterIntakeByDate,
    addCustomFood,
    addFoodLog,
    removeFoodLog,
    addSavedMeal,
    logSavedMeal,
    addWaterMl,
    setNutritionTargets,
  } = useFitness();

  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const [selectedMeal, setSelectedMeal] = useState<MealSlot>("Lunch");
  const [foodQuery, setFoodQuery] = useState("");
  const [customFoodOpen, setCustomFoodOpen] = useState(false);
  const [cfName, setCfName] = useState("");
  const [cfServing, setCfServing] = useState("100g");
  const [cfCals, setCfCals] = useState("200");
  const [cfPro, setCfPro] = useState("20");
  const [cfCarb, setCfCarb] = useState("15");
  const [cfFat, setCfFat] = useState("5");
  const [cfBarcode, setCfBarcode] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [tdeeOpen, setTdeeOpen] = useState(false);

  // TDEE calculator inputs
  const [tdeeWeight, setTdeeWeight] = useState(77);
  const [tdeeHeight, setTdeeHeight] = useState(178);
  const [tdeeAge, setTdeeAge] = useState(27);
  const [tdeeSex, setTdeeSex] = useState<"male" | "female">("male");
  const [tdeeActivity, setTdeeActivity] = useState(1.55);
  const [tdeeGoal, setTdeeGoal] = useState<"cut" | "maintain" | "bulk">(
    nutritionTargets.goalMode,
  );

  const dayLogs = useMemo(
    () => foodLogs.filter((f) => f.date === selectedDate),
    [foodLogs, selectedDate],
  );

  const totals = useMemo(() => {
    return dayLogs.reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [dayLogs]);

  const waterMl = waterIntakeByDate[selectedDate] || 0;
  const waterPct = Math.min(
    100,
    Math.round((waterMl / nutritionTargets.waterMl) * 100),
  );

  const filteredFoods = useMemo(() => {
    return foodDatabase.filter((f) =>
      f.name.toLowerCase().includes(foodQuery.toLowerCase()),
    );
  }, [foodDatabase, foodQuery]);

  const barcodeMatch = useMemo(() => {
    if (!barcodeInput.trim()) return null;
    return foodDatabase.find((f) => f.barcode === barcodeInput.trim()) || null;
  }, [foodDatabase, barcodeInput]);

  const tdeeResult = calculateTDEEAndMacros({
    weightKg: tdeeWeight,
    heightCm: tdeeHeight,
    age: tdeeAge,
    sex: tdeeSex,
    activityMultiplier: tdeeActivity,
    goal: tdeeGoal,
  });

  const macroCards = [
    {
      label: "Calories",
      val: Math.round(totals.calories),
      target: nutritionTargets.calories,
      unit: "kcal",
      color: "bg-[var(--accent)]",
    },
    {
      label: "Protein",
      val: Math.round(totals.protein),
      target: nutritionTargets.protein,
      unit: "g",
      color: "bg-emerald-500",
    },
    {
      label: "Carbs",
      val: Math.round(totals.carbs),
      target: nutritionTargets.carbs,
      unit: "g",
      color: "bg-amber-500",
    },
    {
      label: "Fat",
      val: Math.round(totals.fat),
      target: nutritionTargets.fat,
      unit: "g",
      color: "bg-violet-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls & Daily Targets */}
      <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--i)]">
              Daily Nutrition &amp; Macros
            </h2>
            <p className="text-xs text-[var(--m)]">
              Goal mode:{" "}
              <span className="capitalize font-semibold text-[var(--i)]">
                {nutritionTargets.goalMode}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="in !h-8 !w-auto text-xs"
            />
            <button
              type="button"
              onClick={() => setBarcodeOpen(true)}
              className="bt !w-auto !h-8 px-3 text-xs"
            >
              <Barcode size={13} />
              <span>Barcode Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setTdeeOpen(true)}
              className="bt p !w-auto !h-8 px-3 text-xs"
            >
              <Calculator size={13} />
              <span>TDEE Calculator</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {macroCards.map((m) => {
            const pct = Math.min(100, Math.round((m.val / m.target) * 100));
            return (
              <div
                key={m.label}
                className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--m)] font-medium">{m.label}</span>
                  <span className="text-[var(--i)] font-semibold">
                    {m.val} / {m.target} {m.unit}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--h)] overflow-hidden">
                  <div
                    className={`h-full ${m.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Water Intake Bar */}
        <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[var(--accent)] flex items-center justify-center">
              <Droplets size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--i)]">
                Water Intake: {waterMl} ml / {nutritionTargets.waterMl} ml (
                {waterPct}%)
              </div>
              <div className="w-44 h-1.5 rounded-full bg-[var(--h)] overflow-hidden mt-1">
                <div
                  className="h-full bg-[var(--accent)]"
                  style={{ width: `${waterPct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addWaterMl(selectedDate, 250)}
              className="bt !w-auto !h-7 px-2.5 text-xs"
            >
              +250 ml
            </button>
            <button
              type="button"
              onClick={() => addWaterMl(selectedDate, 500)}
              className="bt !w-auto !h-7 px-2.5 text-xs"
            >
              +500 ml
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Meal Log + Food DB & Saved Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[var(--i)]">
            Food Log ({selectedDate})
          </h3>

          <div className="flex flex-col gap-3">
            {MEAL_SLOTS.map((slot) => {
              const items = dayLogs.filter((l) => l.meal === slot);
              const slotCals = items.reduce((s, i) => s + i.calories, 0);
              return (
                <div
                  key={slot}
                  className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--i)]">
                      {slot}
                    </span>
                    <span className="text-xs text-[var(--m)]">
                      {Math.round(slotCals)} kcal
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-[11px] text-[var(--m)]">
                      No items logged for {slot.toLowerCase()}.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--h)]">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-medium text-[var(--i)]">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[var(--m)]">
                              {item.calories} kcal · P {item.protein}g · C{" "}
                              {item.carbs}g · F {item.fat}g
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFoodLog(item.id)}
                            className="ib !w-7 !h-7 text-[var(--m)] hover:text-[var(--error)]"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Food Database & Saved Meals */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--i)]">
                Quick Add Food
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomFoodOpen(true)}
                  className="bt !w-auto !h-8 px-2.5 text-xs"
                >
                  <Plus size={12} />
                  <span>New Food</span>
                </button>
                <div className="relative">
                  <select
                    value={selectedMeal}
                    onChange={(e) =>
                      setSelectedMeal(e.target.value as MealSlot)
                    }
                    className="h-8 pl-2.5 pr-7 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                  >
                    {MEAL_SLOTS.map((s) => (
                      <option
                        key={s}
                        value={s}
                        className="bg-[var(--bg)] text-[var(--i)]"
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)]"
              />
              <input
                type="text"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                placeholder="Search food database..."
                className="in in-prefix !h-9 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto styled-scrollbar">
              {filteredFoods.length === 0 ? (
                <p className="text-xs text-[var(--m)] py-4 text-center">
                  No foods in your database yet. Click &quot;New Food&quot; to
                  add one.
                </p>
              ) : null}
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() =>
                    addFoodLog({
                      date: selectedDate,
                      meal: selectedMeal,
                      foodId: food.id,
                      name: food.name,
                      servings: 1,
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fat: food.fat,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--h)] hover:bg-[var(--s)] flex items-center justify-between text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-[var(--i)]">
                      {food.name} ({food.servingSize})
                    </div>
                    <div className="text-[11px] text-[var(--m)]">
                      {food.calories} kcal · P {food.protein}g · C {food.carbs}g
                      · F {food.fat}g
                    </div>
                  </div>
                  <Plus size={14} className="text-[var(--accent)] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Saved Meals */}
          <div className="bg-[var(--surface-card)] border border-[var(--h)] rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Utensils size={14} className="text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--i)]">
                Saved Meals &amp; Recipes
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {savedMeals.length === 0 ? (
                <p className="text-xs text-[var(--m)]">No saved meals yet.</p>
              ) : null}
              {savedMeals.map((sm) => (
                <div
                  key={sm.id}
                  className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--h)] flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-[var(--i)]">
                      {sm.name}
                    </div>
                    <div className="text-[11px] text-[var(--m)]">
                      {sm.description} · {sm.calories} kcal ({sm.protein}g P)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      logSavedMeal(sm.id, selectedDate, selectedMeal)
                    }
                    className="bt p !w-auto !h-7 px-2.5 text-[11px]"
                  >
                    Log
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Food Modal */}
      {customFoodOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!cfName.trim()) return;
              await addCustomFood({
                name: cfName.trim(),
                barcode: cfBarcode.trim() || undefined,
                servingSize: cfServing.trim() || "100g",
                calories: Number(cfCals) || 0,
                protein: Number(cfPro) || 0,
                carbs: Number(cfCarb) || 0,
                fat: Number(cfFat) || 0,
              });
              setCfName("");
              setCfBarcode("");
              setCustomFoodOpen(false);
            }}
            className="w-full max-w-md bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)] bg-[var(--surface-card)]">
              <h3 className="text-sm font-semibold text-[var(--i)]">
                Add Custom Food
              </h3>
              <button
                type="button"
                onClick={() => setCustomFoodOpen(false)}
                className="ib !w-8 !h-8"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <label>
                <span>Food Name</span>
                <input
                  type="text"
                  required
                  value={cfName}
                  onChange={(e) => setCfName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Breast"
                  className="in"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span>Serving Size</span>
                  <input
                    type="text"
                    value={cfServing}
                    onChange={(e) => setCfServing(e.target.value)}
                    className="in !h-9 text-xs"
                  />
                </label>
                <label>
                  <span>Barcode (optional)</span>
                  <input
                    type="text"
                    value={cfBarcode}
                    onChange={(e) => setCfBarcode(e.target.value)}
                    className="in !h-9 text-xs"
                  />
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <label>
                  <span>Calories</span>
                  <input
                    type="number"
                    value={cfCals}
                    onChange={(e) => setCfCals(e.target.value)}
                    className="in !h-9 text-xs"
                  />
                </label>
                <label>
                  <span>Protein (g)</span>
                  <input
                    type="number"
                    value={cfPro}
                    onChange={(e) => setCfPro(e.target.value)}
                    className="in !h-9 text-xs"
                  />
                </label>
                <label>
                  <span>Carbs (g)</span>
                  <input
                    type="number"
                    value={cfCarb}
                    onChange={(e) => setCfCarb(e.target.value)}
                    className="in !h-9 text-xs"
                  />
                </label>
                <label>
                  <span>Fat (g)</span>
                  <input
                    type="number"
                    value={cfFat}
                    onChange={(e) => setCfFat(e.target.value)}
                    className="in !h-9 text-xs"
                  />
                </label>
              </div>
              <button type="submit" className="bt p mt-1">
                <Plus size={14} />
                <span>Save Food</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {barcodeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)] bg-[var(--surface-card)]">
              <div className="flex items-center gap-2">
                <Barcode size={16} className="text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--i)]">
                  Barcode Food Lookup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBarcodeOpen(false)}
                className="ib !w-8 !h-8"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Enter UPC/EAN (try 001122334455)"
                className="in"
              />
              {barcodeMatch ? (
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[var(--i)]">
                      {barcodeMatch.name}
                    </div>
                    <div className="text-[11px] text-[var(--m)]">
                      {barcodeMatch.calories} kcal · P {barcodeMatch.protein}g
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      addFoodLog({
                        date: selectedDate,
                        meal: selectedMeal,
                        foodId: barcodeMatch.id,
                        name: barcodeMatch.name,
                        servings: 1,
                        calories: barcodeMatch.calories,
                        protein: barcodeMatch.protein,
                        carbs: barcodeMatch.carbs,
                        fat: barcodeMatch.fat,
                      });
                      setBarcodeOpen(false);
                    }}
                    className="bt p !w-auto !h-8 px-3 text-xs"
                  >
                    Add to {selectedMeal}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--m)]">
                  Sample barcodes: 001234567890 (Oats), 001122334455 (Chicken),
                  009876543210 (Whey)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TDEE Calculator Modal */}
      {tdeeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg)] border border-[var(--h)] rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--h)] bg-[var(--surface-card)]">
              <h3 className="text-sm font-semibold text-[var(--i)]">
                TDEE &amp; Macro Calculator
              </h3>
              <button
                type="button"
                onClick={() => setTdeeOpen(false)}
                className="ib !w-8 !h-8"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <label>
                  <span>Weight (kg)</span>
                  <input
                    type="number"
                    value={tdeeWeight}
                    onChange={(e) => setTdeeWeight(Number(e.target.value))}
                    className="in !h-9 text-xs"
                  />
                </label>
                <label>
                  <span>Height (cm)</span>
                  <input
                    type="number"
                    value={tdeeHeight}
                    onChange={(e) => setTdeeHeight(Number(e.target.value))}
                    className="in !h-9 text-xs"
                  />
                </label>
                <label>
                  <span>Age</span>
                  <input
                    type="number"
                    value={tdeeAge}
                    onChange={(e) => setTdeeAge(Number(e.target.value))}
                    className="in !h-9 text-xs"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={tdeeSex}
                    onChange={(e) =>
                      setTdeeSex(e.target.value as "male" | "female")
                    }
                    className="w-full h-9 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                  >
                    <option
                      value="male"
                      className="bg-[var(--bg)] text-[var(--i)]"
                    >
                      Male
                    </option>
                    <option
                      value="female"
                      className="bg-[var(--bg)] text-[var(--i)]"
                    >
                      Female
                    </option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                  />
                </div>
                <div className="relative">
                  <select
                    value={tdeeActivity}
                    onChange={(e) => setTdeeActivity(Number(e.target.value))}
                    className="w-full h-9 pl-3 pr-8 rounded-lg bg-[var(--bg)] border border-[var(--h)] text-xs font-medium text-[var(--i)] appearance-none cursor-pointer"
                  >
                    <option
                      value={1.2}
                      className="bg-[var(--bg)] text-[var(--i)]"
                    >
                      Sedentary
                    </option>
                    <option
                      value={1.375}
                      className="bg-[var(--bg)] text-[var(--i)]"
                    >
                      Light (1-3d)
                    </option>
                    <option
                      value={1.55}
                      className="bg-[var(--bg)] text-[var(--i)]"
                    >
                      Moderate (3-5d)
                    </option>
                    <option
                      value={1.725}
                      className="bg-[var(--bg)] text-[var(--i)]"
                    >
                      Active (6-7d)
                    </option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
                  />
                </div>
              </div>

              <div className="nav-pill-group grid grid-cols-3 gap-1">
                {(["cut", "maintain", "bulk"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTdeeGoal(g)}
                    className={`nav-pill-item capitalize cursor-pointer ${
                      tdeeGoal === g
                        ? "bg-[var(--p)] text-[var(--pt)]"
                        : "text-[var(--m)]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--m)]">Maintenance TDEE</span>
                  <span className="font-semibold text-[var(--i)]">
                    {tdeeResult.tdee} kcal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--m)]">Target Calories</span>
                  <span className="font-bold text-[var(--accent)]">
                    {tdeeResult.targetCalories} kcal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--m)]">Macros (P / C / F)</span>
                  <span className="font-semibold text-[var(--i)]">
                    {tdeeResult.protein}g / {tdeeResult.carbs}g /{" "}
                    {tdeeResult.fat}g
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNutritionTargets({
                    calories: tdeeResult.targetCalories,
                    protein: tdeeResult.protein,
                    carbs: tdeeResult.carbs,
                    fat: tdeeResult.fat,
                    waterMl: nutritionTargets.waterMl,
                    goalMode: tdeeGoal,
                  });
                  setTdeeOpen(false);
                }}
                className="bt p"
              >
                Apply to Daily Targets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
