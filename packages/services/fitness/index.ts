// Business logic service for Fitness Tracker
import { db } from "@repo/database";
import {
  fitnessBodyMetrics,
  fitnessBodyweightSkills,
  fitnessCardioSessions,
  fitnessExercises,
  fitnessFoodLogs,
  fitnessFoods,
  fitnessGoals,
  fitnessInjuries,
  fitnessNutritionSettings,
  fitnessPrograms,
  fitnessProgressPhotos,
  fitnessRecoveryLogs,
  fitnessSavedMeals,
  fitnessTemplateExercises,
  fitnessWaterLogs,
  fitnessWorkoutExercises,
  fitnessWorkoutSessions,
  fitnessWorkoutSets,
  fitnessWorkoutTemplates,
} from "@repo/database/models";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { AppError } from "@repo/error";
import { DEFAULT_EXERCISES, FAMOUS_TEMPLATES } from "./catalog";

export default class FitnessService {
  // Ensure global exercise catalog and famous templates exist in DB (idempotent)
  async ensureCatalogSeeded() {
    for (const ex of DEFAULT_EXERCISES) {
      await db
        .insert(fitnessExercises)
        .values({
          slug: ex.slug,
          userId: null,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          secondaryMuscles: ex.secondaryMuscles ?? [],
          equipment: ex.equipment,
          defaultRestSeconds: ex.defaultRestSeconds,
          isCustom: false,
        })
        .onConflictDoNothing({ target: fitnessExercises.slug });
    }

    const allSystemExercises = await db
      .select()
      .from(fitnessExercises)
      .where(isNull(fitnessExercises.userId));

    const slugToId = new Map<string, string>();
    for (const row of allSystemExercises) {
      if (row.slug) slugToId.set(row.slug, row.exerciseId);
    }

    for (const tpl of FAMOUS_TEMPLATES) {
      const existing = await db
        .select()
        .from(fitnessWorkoutTemplates)
        .where(eq(fitnessWorkoutTemplates.slug, tpl.slug))
        .limit(1);

      if (existing.length > 0) continue;

      const [insertedTpl] = await db
        .insert(fitnessWorkoutTemplates)
        .values({
          slug: tpl.slug,
          userId: null,
          name: tpl.name,
          category: tpl.category,
          description: tpl.description,
          estimatedMinutes: tpl.estimatedMinutes,
          isSystem: true,
        })
        .onConflictDoNothing({ target: fitnessWorkoutTemplates.slug })
        .returning();

      if (!insertedTpl) continue;

      const tplExValues = tpl.exercises
        .map((te, idx) => {
          const exId = slugToId.get(te.exerciseSlug);
          if (!exId) return null;
          return {
            templateId: insertedTpl.templateId,
            exerciseId: exId,
            sortOrder: idx,
            targetSets: te.targetSets,
            targetReps: te.targetReps,
            restSeconds: te.restSeconds,
            supersetGroupId: te.supersetGroupId ?? null,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (tplExValues.length > 0) {
        await db.insert(fitnessTemplateExercises).values(tplExValues);
      }
    }
  }

  // Fetch complete Fitness workspace for user (zero nutrition or program defaults)
  async getWorkspace(userId: string) {
    await this.ensureCatalogSeeded();

    const [
      exercises,
      templates,
      templateExercises,
      programs,
      sessions,
      cardioSessions,
      skills,
      foods,
      foodLogs,
      savedMeals,
      nutritionSettingRows,
      waterLogs,
      bodyMetrics,
      progressPhotos,
      recoveryLogs,
      injuries,
      goals,
    ] = await Promise.all([
      db
        .select()
        .from(fitnessExercises)
        .where(
          or(
            isNull(fitnessExercises.userId),
            eq(fitnessExercises.userId, userId),
          ),
        ),
      db
        .select()
        .from(fitnessWorkoutTemplates)
        .where(
          or(
            isNull(fitnessWorkoutTemplates.userId),
            eq(fitnessWorkoutTemplates.userId, userId),
          ),
        ),
      db.select().from(fitnessTemplateExercises),
      db
        .select()
        .from(fitnessPrograms)
        .where(eq(fitnessPrograms.userId, userId))
        .orderBy(desc(fitnessPrograms.createdAt)),
      db
        .select()
        .from(fitnessWorkoutSessions)
        .where(eq(fitnessWorkoutSessions.userId, userId))
        .orderBy(desc(fitnessWorkoutSessions.date)),
      db
        .select()
        .from(fitnessCardioSessions)
        .where(eq(fitnessCardioSessions.userId, userId))
        .orderBy(desc(fitnessCardioSessions.date)),
      db
        .select()
        .from(fitnessBodyweightSkills)
        .where(eq(fitnessBodyweightSkills.userId, userId)),
      db
        .select()
        .from(fitnessFoods)
        .where(eq(fitnessFoods.userId, userId))
        .orderBy(desc(fitnessFoods.createdAt)),
      db
        .select()
        .from(fitnessFoodLogs)
        .where(eq(fitnessFoodLogs.userId, userId))
        .orderBy(desc(fitnessFoodLogs.createdAt)),
      db
        .select()
        .from(fitnessSavedMeals)
        .where(eq(fitnessSavedMeals.userId, userId))
        .orderBy(desc(fitnessSavedMeals.createdAt)),
      db
        .select()
        .from(fitnessNutritionSettings)
        .where(eq(fitnessNutritionSettings.userId, userId))
        .limit(1),
      db
        .select()
        .from(fitnessWaterLogs)
        .where(eq(fitnessWaterLogs.userId, userId)),
      db
        .select()
        .from(fitnessBodyMetrics)
        .where(eq(fitnessBodyMetrics.userId, userId))
        .orderBy(desc(fitnessBodyMetrics.date)),
      db
        .select()
        .from(fitnessProgressPhotos)
        .where(eq(fitnessProgressPhotos.userId, userId))
        .orderBy(desc(fitnessProgressPhotos.date)),
      db
        .select()
        .from(fitnessRecoveryLogs)
        .where(eq(fitnessRecoveryLogs.userId, userId))
        .orderBy(desc(fitnessRecoveryLogs.date)),
      db
        .select()
        .from(fitnessInjuries)
        .where(eq(fitnessInjuries.userId, userId))
        .orderBy(desc(fitnessInjuries.createdAt)),
      db
        .select()
        .from(fitnessGoals)
        .where(eq(fitnessGoals.userId, userId))
        .orderBy(desc(fitnessGoals.createdAt)),
    ]);

    // Hydrate workout exercises & sets for user's sessions
    const sessionIds = sessions.map((s) => s.sessionId);
    const workoutExercises =
      sessionIds.length > 0
        ? await db.select().from(fitnessWorkoutExercises)
        : [];
    const userSessionExercises = workoutExercises.filter((we) =>
      sessionIds.includes(we.sessionId),
    );
    const weIds = userSessionExercises.map((we) => we.workoutExerciseId);
    const allSets =
      weIds.length > 0 ? await db.select().from(fitnessWorkoutSets) : [];
    const userSets = allSets.filter((st) =>
      weIds.includes(st.workoutExerciseId),
    );

    const hydratedSessions = sessions.map((sess) => {
      const sessExs = userSessionExercises
        .filter((we) => we.sessionId === sess.sessionId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((we) => ({
          id: we.workoutExerciseId,
          exerciseId: we.exerciseId,
          exerciseName: we.exerciseName,
          muscleGroup: we.muscleGroup,
          equipment: we.equipment,
          supersetGroupId: we.supersetGroupId ?? undefined,
          notes: we.notes ?? undefined,
          sets: userSets
            .filter((st) => st.workoutExerciseId === we.workoutExerciseId)
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((st) => ({
              id: st.setId,
              setNumber: st.setNumber,
              type: st.type,
              weight: st.weight,
              reps: st.reps,
              rpe: st.rpe ?? undefined,
              rir: st.rir ?? undefined,
              tempo: st.tempo ?? undefined,
              restSeconds: st.restSeconds,
              completed: st.completed,
              prs: st.prs ?? undefined,
            })),
        }));

      return {
        id: sess.sessionId,
        title: sess.title,
        templateId: sess.templateId ?? undefined,
        date: sess.date,
        startedAt: sess.startedAt.toISOString(),
        completedAt: sess.completedAt?.toISOString(),
        durationMinutes: sess.durationMinutes,
        isDeload: sess.isDeload,
        notes: sess.notes ?? undefined,
        exercises: sessExs,
      };
    });

    const hydratedTemplates = templates.map((tpl) => ({
      id: tpl.templateId,
      name: tpl.name,
      category: tpl.category,
      description: tpl.description,
      estimatedMinutes: tpl.estimatedMinutes,
      exercises: templateExercises
        .filter((te) => te.templateId === tpl.templateId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((te) => ({
          exerciseId: te.exerciseId,
          targetSets: te.targetSets,
          targetReps: te.targetReps,
          restSeconds: te.restSeconds,
          supersetGroupId: te.supersetGroupId ?? undefined,
        })),
    }));

    const waterIntakeByDate: Record<string, number> = {};
    for (const w of waterLogs) {
      waterIntakeByDate[w.date] = w.amountMl;
    }

    const ns = nutritionSettingRows[0];

    return {
      exercises: exercises.map((e) => ({
        id: e.exerciseId,
        name: e.name,
        muscleGroup: e.muscleGroup,
        secondaryMuscles: e.secondaryMuscles ?? undefined,
        equipment: e.equipment,
        defaultRestSeconds: e.defaultRestSeconds,
        isCustom: e.isCustom,
        notes: e.notes ?? undefined,
      })),
      templates: hydratedTemplates,
      programs: programs.map((p) => ({
        id: p.programId,
        name: p.name,
        style: p.style,
        description: p.description,
        totalWeeks: p.totalWeeks,
        currentWeek: p.currentWeek,
        deloadEveryWeeks: p.deloadEveryWeeks,
        progressionRule: p.progressionRule,
        templateIds: p.templateIds,
      })),
      sessions: hydratedSessions,
      cardioSessions: cardioSessions.map((c) => ({
        id: c.cardioId,
        type: c.type,
        date: c.date,
        distanceKm: c.distanceKm,
        durationMinutes: c.durationMinutes,
        heartRateAvg: c.heartRateAvg ?? undefined,
        calories: c.calories,
        notes: c.notes ?? undefined,
      })),
      skills: skills.map((sk) => ({
        id: sk.skillId,
        name: sk.name,
        category: sk.category,
        stages: sk.stages,
        stageIndex: sk.stageIndex,
        currentStage: sk.currentStage,
        targetHoldOrReps: sk.targetHoldOrReps,
        lastPracticed: sk.lastPracticed ?? undefined,
      })),
      foodDatabase: foods.map((f) => ({
        id: f.foodId,
        name: f.name,
        barcode: f.barcode ?? undefined,
        servingSize: f.servingSize,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
      })),
      foodLogs: foodLogs.map((fl) => ({
        id: fl.foodLogId,
        date: fl.date,
        meal: fl.meal,
        foodId: fl.foodId ?? "",
        name: fl.name,
        servings: fl.servings,
        calories: fl.calories,
        protein: fl.protein,
        carbs: fl.carbs,
        fat: fl.fat,
      })),
      savedMeals: savedMeals.map((sm) => ({
        id: sm.savedMealId,
        name: sm.name,
        description: sm.description,
        calories: sm.calories,
        protein: sm.protein,
        carbs: sm.carbs,
        fat: sm.fat,
      })),
      nutritionTargets: ns
        ? {
            calories: ns.calories,
            protein: ns.protein,
            carbs: ns.carbs,
            fat: ns.fat,
            waterMl: ns.waterMl,
            goalMode: ns.goalMode,
          }
        : {
            calories: 2200,
            protein: 150,
            carbs: 240,
            fat: 70,
            waterMl: 3000,
            goalMode: "maintain",
          },
      waterIntakeByDate,
      bodyMetrics: bodyMetrics.map((bm) => ({
        id: bm.metricId,
        date: bm.date,
        weight: bm.weight,
        bodyFatPct: bm.bodyFatPct ?? undefined,
        chestCm: bm.chestCm ?? undefined,
        waistCm: bm.waistCm ?? undefined,
        armsCm: bm.armsCm ?? undefined,
        thighsCm: bm.thighsCm ?? undefined,
      })),
      progressPhotos: progressPhotos.map((pp) => ({
        id: pp.photoId,
        date: pp.date,
        pose: pp.pose,
        weight: pp.weight ?? undefined,
        dataUrl: pp.dataUrl ?? undefined,
        notes: pp.notes ?? undefined,
      })),
      recoveryLogs: recoveryLogs.map((r) => ({
        id: r.recoveryId,
        date: r.date,
        sleepHours: r.sleepHours,
        sleepQuality: r.sleepQuality,
        soreness: r.soreness,
        fatigue: r.fatigue,
        restingHeartRate: r.restingHeartRate ?? undefined,
        steps: r.steps ?? undefined,
        notes: r.notes ?? undefined,
      })),
      injuries: injuries.map((inj) => ({
        id: inj.injuryId,
        title: inj.title,
        bodyPart: inj.bodyPart,
        severity: inj.severity,
        status: inj.status,
        startedAt: inj.startedAt,
        avoidExerciseIds: inj.avoidExerciseIds,
        notes: inj.notes ?? undefined,
      })),
      goals: goals.map((g) => ({
        id: g.goalId,
        title: g.title,
        category: g.category,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        unit: g.unit,
        targetDate: g.targetDate,
        completed: g.completed,
      })),
    };
  }

  // Create custom exercise
  async createCustomExercise(
    userId: string,
    data: {
      name: string;
      muscleGroup: string;
      equipment: string;
      defaultRestSeconds?: number;
      secondaryMuscles?: string[];
    },
  ) {
    const [created] = await db
      .insert(fitnessExercises)
      .values({
        userId,
        name: data.name,
        muscleGroup: data.muscleGroup,
        secondaryMuscles: data.secondaryMuscles ?? [],
        equipment: data.equipment,
        defaultRestSeconds: data.defaultRestSeconds ?? 90,
        isCustom: true,
      })
      .returning();
    return created;
  }

  // Save completed workout session with exercises & sets
  async saveWorkoutSession(
    userId: string,
    data: {
      title: string;
      templateId?: string;
      date: string;
      startedAt: string;
      completedAt?: string;
      durationMinutes: number;
      isDeload?: boolean;
      notes?: string;
      exercises: Array<{
        exerciseId: string;
        exerciseName: string;
        muscleGroup: string;
        equipment: string;
        supersetGroupId?: string;
        notes?: string;
        sets: Array<{
          setNumber: number;
          type: string;
          weight: number;
          reps: number;
          rpe?: number;
          rir?: number;
          tempo?: string;
          restSeconds: number;
          completed: boolean;
          prs?: string[];
        }>;
      }>;
    },
  ) {
    const [session] = await db
      .insert(fitnessWorkoutSessions)
      .values({
        userId,
        templateId: data.templateId ?? null,
        title: data.title,
        date: data.date,
        startedAt: new Date(data.startedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
        durationMinutes: data.durationMinutes,
        isDeload: data.isDeload ?? false,
        notes: data.notes ?? null,
      })
      .returning();

    if (!session) {
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Failed to save workout session",
      );
    }

    for (let i = 0; i < data.exercises.length; i++) {
      const ex = data.exercises[i]!;
      const [we] = await db
        .insert(fitnessWorkoutExercises)
        .values({
          sessionId: session.sessionId,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment,
          sortOrder: i,
          supersetGroupId: ex.supersetGroupId ?? null,
          notes: ex.notes ?? null,
        })
        .returning();

      if (we && ex.sets.length > 0) {
        await db.insert(fitnessWorkoutSets).values(
          ex.sets.map((st) => ({
            workoutExerciseId: we.workoutExerciseId,
            setNumber: st.setNumber,
            type: st.type,
            weight: st.weight,
            reps: st.reps,
            rpe: st.rpe ?? null,
            rir: st.rir ?? null,
            tempo: st.tempo ?? null,
            restSeconds: st.restSeconds,
            completed: st.completed,
            prs: st.prs ?? [],
          })),
        );
      }
    }

    return session;
  }

  // Create user training program
  async createProgram(
    userId: string,
    data: {
      name: string;
      style: string;
      description?: string;
      totalWeeks: number;
      deloadEveryWeeks?: number;
      progressionRule?: string;
      templateIds?: string[];
    },
  ) {
    const [created] = await db
      .insert(fitnessPrograms)
      .values({
        userId,
        name: data.name,
        style: data.style,
        description: data.description ?? "",
        totalWeeks: data.totalWeeks,
        currentWeek: 1,
        deloadEveryWeeks: data.deloadEveryWeeks ?? 4,
        progressionRule: data.progressionRule ?? "",
        templateIds: data.templateIds ?? [],
      })
      .returning();
    return created;
  }

  // Advance training program week
  async advanceProgramWeek(userId: string, programId: string) {
    const [existing] = await db
      .select()
      .from(fitnessPrograms)
      .where(
        and(
          eq(fitnessPrograms.programId, programId),
          eq(fitnessPrograms.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Program not found");
    }

    const nextWeek =
      existing.currentWeek >= existing.totalWeeks
        ? 1
        : existing.currentWeek + 1;
    const [updated] = await db
      .update(fitnessPrograms)
      .set({ currentWeek: nextWeek })
      .where(eq(fitnessPrograms.programId, programId))
      .returning();
    return updated;
  }

  // Delete training program
  async deleteProgram(userId: string, programId: string) {
    await db
      .delete(fitnessPrograms)
      .where(
        and(
          eq(fitnessPrograms.programId, programId),
          eq(fitnessPrograms.userId, userId),
        ),
      );
    return { deleted: true };
  }

  // Log cardio session
  async addCardioSession(
    userId: string,
    data: {
      type: string;
      date: string;
      distanceKm: number;
      durationMinutes: number;
      heartRateAvg?: number;
      calories: number;
      notes?: string;
    },
  ) {
    const [created] = await db
      .insert(fitnessCardioSessions)
      .values({
        userId,
        type: data.type,
        date: data.date,
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        heartRateAvg: data.heartRateAvg ?? null,
        calories: data.calories,
        notes: data.notes ?? null,
      })
      .returning();
    return created;
  }

  // Create bodyweight skill or mobility routine
  async createSkill(
    userId: string,
    data: {
      name: string;
      category: string;
      stages: string[];
      targetHoldOrReps: string;
    },
  ) {
    const [created] = await db
      .insert(fitnessBodyweightSkills)
      .values({
        userId,
        name: data.name,
        category: data.category,
        stages: data.stages,
        stageIndex: 0,
        currentStage: data.stages[0] ?? "Stage 1",
        targetHoldOrReps: data.targetHoldOrReps,
      })
      .returning();
    return created;
  }

  // Advance skill progression stage
  async advanceSkillStage(userId: string, skillId: string, date: string) {
    const [existing] = await db
      .select()
      .from(fitnessBodyweightSkills)
      .where(
        and(
          eq(fitnessBodyweightSkills.skillId, skillId),
          eq(fitnessBodyweightSkills.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Skill not found");
    }

    const nextIdx = Math.min(
      existing.stages.length - 1,
      existing.stageIndex + 1,
    );
    const [updated] = await db
      .update(fitnessBodyweightSkills)
      .set({
        stageIndex: nextIdx,
        currentStage: existing.stages[nextIdx] ?? existing.currentStage,
        lastPracticed: date,
      })
      .where(eq(fitnessBodyweightSkills.skillId, skillId))
      .returning();
    return updated;
  }

  // Add custom food to user's food database
  async addFood(
    userId: string,
    data: {
      name: string;
      barcode?: string;
      servingSize: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
  ) {
    const [created] = await db
      .insert(fitnessFoods)
      .values({
        userId,
        name: data.name,
        barcode: data.barcode ?? null,
        servingSize: data.servingSize,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
      })
      .returning();
    return created;
  }

  // Add food log entry
  async addFoodLog(
    userId: string,
    data: {
      date: string;
      meal: string;
      foodId?: string;
      name: string;
      servings: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
  ) {
    const [created] = await db
      .insert(fitnessFoodLogs)
      .values({
        userId,
        date: data.date,
        meal: data.meal,
        foodId: data.foodId ?? null,
        name: data.name,
        servings: data.servings,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
      })
      .returning();
    return created;
  }

  // Remove food log entry
  async removeFoodLog(userId: string, foodLogId: string) {
    await db
      .delete(fitnessFoodLogs)
      .where(
        and(
          eq(fitnessFoodLogs.foodLogId, foodLogId),
          eq(fitnessFoodLogs.userId, userId),
        ),
      );
    return { deleted: true };
  }

  // Create saved meal
  async addSavedMeal(
    userId: string,
    data: {
      name: string;
      description: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
  ) {
    const [created] = await db
      .insert(fitnessSavedMeals)
      .values({
        userId,
        ...data,
      })
      .returning();
    return created;
  }

  // Update nutrition targets
  async setNutritionTargets(
    userId: string,
    data: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      waterMl: number;
      goalMode: string;
    },
  ) {
    const [existing] = await db
      .select()
      .from(fitnessNutritionSettings)
      .where(eq(fitnessNutritionSettings.userId, userId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(fitnessNutritionSettings)
        .set(data)
        .where(eq(fitnessNutritionSettings.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(fitnessNutritionSettings)
      .values({ userId, ...data })
      .returning();
    return created;
  }

  // Add water intake for date
  async addWaterMl(userId: string, date: string, amountMl: number) {
    const [existing] = await db
      .select()
      .from(fitnessWaterLogs)
      .where(
        and(
          eq(fitnessWaterLogs.userId, userId),
          eq(fitnessWaterLogs.date, date),
        ),
      )
      .limit(1);

    if (existing) {
      const next = Math.max(0, existing.amountMl + amountMl);
      const [updated] = await db
        .update(fitnessWaterLogs)
        .set({ amountMl: next })
        .where(eq(fitnessWaterLogs.waterLogId, existing.waterLogId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(fitnessWaterLogs)
      .values({ userId, date, amountMl: Math.max(0, amountMl) })
      .returning();
    return created;
  }

  // Add body metric entry
  async addBodyMetric(
    userId: string,
    data: {
      date: string;
      weight: number;
      bodyFatPct?: number;
      chestCm?: number;
      waistCm?: number;
      armsCm?: number;
      thighsCm?: number;
    },
  ) {
    const [created] = await db
      .insert(fitnessBodyMetrics)
      .values({
        userId,
        date: data.date,
        weight: data.weight,
        bodyFatPct: data.bodyFatPct ?? null,
        chestCm: data.chestCm ?? null,
        waistCm: data.waistCm ?? null,
        armsCm: data.armsCm ?? null,
        thighsCm: data.thighsCm ?? null,
      })
      .returning();
    return created;
  }

  // Add progress photo
  async addProgressPhoto(
    userId: string,
    data: {
      date: string;
      pose: string;
      weight?: number;
      dataUrl?: string;
      notes?: string;
    },
  ) {
    const [created] = await db
      .insert(fitnessProgressPhotos)
      .values({
        userId,
        date: data.date,
        pose: data.pose,
        weight: data.weight ?? null,
        dataUrl: data.dataUrl ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return created;
  }

  // Save or update daily recovery log
  async saveRecoveryLog(
    userId: string,
    data: {
      date: string;
      sleepHours: number;
      sleepQuality: number;
      soreness: number;
      fatigue: number;
      restingHeartRate?: number;
      steps?: number;
      notes?: string;
    },
  ) {
    const [existing] = await db
      .select()
      .from(fitnessRecoveryLogs)
      .where(
        and(
          eq(fitnessRecoveryLogs.userId, userId),
          eq(fitnessRecoveryLogs.date, data.date),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(fitnessRecoveryLogs)
        .set({
          sleepHours: data.sleepHours,
          sleepQuality: data.sleepQuality,
          soreness: data.soreness,
          fatigue: data.fatigue,
          restingHeartRate: data.restingHeartRate ?? null,
          steps: data.steps ?? null,
          notes: data.notes ?? null,
        })
        .where(eq(fitnessRecoveryLogs.recoveryId, existing.recoveryId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(fitnessRecoveryLogs)
      .values({
        userId,
        date: data.date,
        sleepHours: data.sleepHours,
        sleepQuality: data.sleepQuality,
        soreness: data.soreness,
        fatigue: data.fatigue,
        restingHeartRate: data.restingHeartRate ?? null,
        steps: data.steps ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return created;
  }

  // Add injury
  async addInjury(
    userId: string,
    data: {
      title: string;
      bodyPart: string;
      severity: string;
      status: string;
      startedAt: string;
      avoidExerciseIds: string[];
      notes?: string;
    },
  ) {
    const [created] = await db
      .insert(fitnessInjuries)
      .values({
        userId,
        title: data.title,
        bodyPart: data.bodyPart,
        severity: data.severity,
        status: data.status,
        startedAt: data.startedAt,
        avoidExerciseIds: data.avoidExerciseIds,
        notes: data.notes ?? null,
      })
      .returning();
    return created;
  }

  // Cycle injury status
  async toggleInjuryStatus(userId: string, injuryId: string) {
    const [existing] = await db
      .select()
      .from(fitnessInjuries)
      .where(
        and(
          eq(fitnessInjuries.injuryId, injuryId),
          eq(fitnessInjuries.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Injury not found");
    }

    const nextStatus =
      existing.status === "Active"
        ? "Recovering"
        : existing.status === "Recovering"
          ? "Resolved"
          : "Active";

    const [updated] = await db
      .update(fitnessInjuries)
      .set({ status: nextStatus })
      .where(eq(fitnessInjuries.injuryId, injuryId))
      .returning();
    return updated;
  }

  // Add goal
  async addGoal(
    userId: string,
    data: {
      title: string;
      category: string;
      currentValue: number;
      targetValue: number;
      unit: string;
      targetDate: string;
      completed?: boolean;
    },
  ) {
    const [created] = await db
      .insert(fitnessGoals)
      .values({
        userId,
        title: data.title,
        category: data.category,
        currentValue: data.currentValue,
        targetValue: data.targetValue,
        unit: data.unit,
        targetDate: data.targetDate,
        completed: data.completed ?? false,
      })
      .returning();
    return created;
  }

  // Update goal progress
  async updateGoalProgress(
    userId: string,
    goalId: string,
    currentValue: number,
  ) {
    const [existing] = await db
      .select()
      .from(fitnessGoals)
      .where(
        and(eq(fitnessGoals.goalId, goalId), eq(fitnessGoals.userId, userId)),
      )
      .limit(1);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Goal not found");
    }

    const completed =
      existing.category === "Bodyweight"
        ? currentValue <= existing.targetValue
        : currentValue >= existing.targetValue;

    const [updated] = await db
      .update(fitnessGoals)
      .set({ currentValue, completed })
      .where(eq(fitnessGoals.goalId, goalId))
      .returning();
    return updated;
  }

  // Delete goal
  async deleteGoal(userId: string, goalId: string) {
    await db
      .delete(fitnessGoals)
      .where(
        and(eq(fitnessGoals.goalId, goalId), eq(fitnessGoals.userId, userId)),
      );
    return { deleted: true };
  }
}
