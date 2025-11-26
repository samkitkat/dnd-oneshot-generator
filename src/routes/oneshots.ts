import { Router, Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const DND5E_API_BASE = "https://www.dnd5eapi.co";
const OPEN5E_API_BASE = "https://api.open5e.com";

// ----- Supabase admin client (server-side) -----
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface SupabaseAuthRequest extends Request {
  userId?: string;
}

// Middleware: require Supabase auth (Google login token)
async function requireSupabaseAuth(
  req: SupabaseAuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.slice("Bearer ".length);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.userId = data.user.id; // Supabase user UUID
  next();
}

// Types
type GenerateOneShotRequestBody = {
  partySize: number;
  averageLevel: number;
  environment: string;
};

type MonsterStatBlock = {
  name: string;
  size: string | null;
  type: string | null;
  alignment: string | null;
  cr: number;
  hp: number;
  ac: number;
  hitDice: string | null;
  speed: string | null;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  senses: string | null;
  languages: string | null;
  actions: { name: string; desc: string }[];
};

type ItemSummary = {
  name: string;
  type: string | null;
  rarity: string | null;
  desc: string | null;
};

type OneShot = {
  title: string;
  hook: string;
  environment: string;
  partySize: number;
  averageLevel: number;
  monsters: MonsterStatBlock[];
  loot: ItemSummary[];
};

// ===== Helpers: D&D 5e API (monsters) =====

async function fetchAllMonsters() {
  const response = await fetch(`${DND5E_API_BASE}/api/monsters`);
  if (!response.ok) {
    throw new Error("Failed to fetch monster list");
  }
  const data = await response.json();
  return data.results as { index: string; name: string; url: string }[];
}

async function fetchMonsterDetails(
  index: string
): Promise<MonsterStatBlock | null> {
  const res = await fetch(`${DND5E_API_BASE}/api/monsters/${index}`);
  if (!res.ok) return null;
  const data: any = await res.json();

  const acValue = Array.isArray(data.armor_class)
    ? data.armor_class[0]?.value || 10
    : data.armor_class || 10;

  // Convert speed object to a readable line (e.g., "walk 30 ft., fly 60 ft.")
  let speedText: string | null = null;
  if (data.speed && typeof data.speed === "object") {
    const parts: string[] = [];
    for (const [k, v] of Object.entries<string>(data.speed)) {
      parts.push(`${k} ${v}`);
    }
    speedText = parts.join(", ");
  } else if (typeof data.speed === "string") {
    speedText = data.speed;
  }

  // Senses: join keys like "darkvision 60 ft." etc.
  let sensesText: string | null = null;
  if (data.senses && typeof data.senses === "object") {
    const parts: string[] = [];
    for (const [k, v] of Object.entries<string>(data.senses)) {
      parts.push(`${k.replace(/_/g, " ")} ${v}`);
    }
    sensesText = parts.join(", ");
  }

  const actions =
    Array.isArray(data.actions) && data.actions.length > 0
      ? data.actions.map((a: any) => ({
          name: a.name as string,
          desc: a.desc as string,
        }))
      : [];

  return {
    name: data.name,
    size: data.size ?? null,
    type: data.type ?? null,
    alignment: data.alignment ?? null,
    cr: data.challenge_rating ?? 0,
    hp: data.hit_points ?? 0,
    ac: acValue,
    hitDice: data.hit_dice ?? null,
    speed: speedText,
    stats: {
      str: data.strength ?? 10,
      dex: data.dexterity ?? 10,
      con: data.constitution ?? 10,
      int: data.intelligence ?? 10,
      wis: data.wisdom ?? 10,
      cha: data.charisma ?? 10,
    },
    senses: sensesText,
    languages: data.languages ?? null,
    actions,
  };
}

function pickCRTargets(avgLevel: number) {
  return [Math.max(0.125, avgLevel - 1), avgLevel, avgLevel + 1];
}

// ===== Helpers: Open5e API (magic items) =====

async function fetchRandomMagicItems(count: number): Promise<ItemSummary[]> {
  const res = await fetch(`${OPEN5E_API_BASE}/magicitems/?page_size=100`);
  if (!res.ok) {
    console.error("Failed to fetch magic items from Open5e");
    return [];
  }

  const data: any = await res.json();
  const results = data.results as any[];

  const shuffled = [...results].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((item) => ({
    name: item.name as string,
    type: item.type ?? null,
    rarity: item.rarity ?? null,
    desc: null, // no description (player can look it up)
  }));
}

// ===== Route: POST /api/oneshots/generate =====
// (no auth required: anyone can generate)
router.post("/generate", async (req, res) => {
  const { partySize, averageLevel, environment } =
    req.body as GenerateOneShotRequestBody;

  if (!partySize || !averageLevel || !environment) {
    return res
      .status(400)
      .json({ error: "partySize, averageLevel, and environment are required" });
  }

  try {
    const allMonsters = await fetchAllMonsters();
    const crTargets = pickCRTargets(averageLevel);

    const chosenMonsters: MonsterStatBlock[] = [];

    for (const cr of crTargets) {
      // take a random sample of monsters and see if any match
      const candidates = [...allMonsters]
        .sort(() => Math.random() - 0.5)
        .slice(0, 15);

      let found: MonsterStatBlock | null = null;

      for (const m of candidates) {
        const details = await fetchMonsterDetails(m.index);
        if (!details) continue;

        if (Math.abs(details.cr - cr) <= 1) {
          found = details;
          break;
        }
      }

      if (found) chosenMonsters.push(found);
    }

    if (chosenMonsters.length === 0) {
      chosenMonsters.push({
        name: "Goblin",
        size: "Small",
        type: "humanoid",
        alignment: "neutral evil",
        cr: 0.25,
        hp: 7,
        ac: 15,
        hitDice: "2d6",
        speed: "walk 30 ft.",
        stats: {
          str: 8,
          dex: 14,
          con: 10,
          int: 10,
          wis: 8,
          cha: 8,
        },
        senses: "darkvision 60 ft., passive Perception 9",
        languages: "Common, Goblin",
        actions: [
          {
            name: "Scimitar",
            desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.",
          },
        ],
      });
    }

    const loot = await fetchRandomMagicItems(3);

    const oneShot: OneShot = {
      title: `Adventure in the ${environment}`,
      hook: `A group of ${partySize} adventurers, around level ${averageLevel}, is hired to investigate strange events in the ${environment}.`,
      environment,
      partySize,
      averageLevel,
      monsters: chosenMonsters,
      loot,
    };

    res.json(oneShot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate one-shot" });
  }
});

// ===== Route: POST /api/oneshots  (save one-shot, auth required) =====
router.post("/", requireSupabaseAuth, async (req: SupabaseAuthRequest, res) => {
  const userId = req.userId!;
  const { name, oneShot } = req.body as { name: string; oneShot: OneShot };

  if (!name || !oneShot) {
    return res.status(400).json({ error: "name and oneShot are required" });
  }

  const { data, error } = await supabaseAdmin
    .from("oneshots")
    .insert({
      user_id: userId,
      name,
      data: oneShot,
      completed: false,
    })
    .select("id, name, created_at, completed")
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save one-shot" });
  }

  return res.json(data);
});

// ===== Route: GET /api/oneshots  (list user's one-shots) =====
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthRequest, res) => {
  const userId = req.userId!;

  const { data, error } = await supabaseAdmin
    .from("oneshots")
    .select("id, name, created_at, completed")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch one-shots" });
  }

  return res.json(data);
});

// ===== Route: GET /api/oneshots/:id  (one-shot details) =====
router.get(
  "/:id",
  requireSupabaseAuth,
  async (req: SupabaseAuthRequest, res) => {
    const userId = req.userId!;
    const id = req.params.id; // uuid string

    const { data, error } = await supabaseAdmin
      .from("oneshots")
      .select("id, name, data, created_at, completed")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error(error);
      return res.status(404).json({ error: "One-shot not found" });
    }

    return res.json(data);
  }
);

// ===== Route: PATCH /api/oneshots/:id  (update completed flag) =====
router.patch(
  "/:id",
  requireSupabaseAuth,
  async (req: SupabaseAuthRequest, res) => {
    const userId = req.userId!;
    const id = req.params.id;
    const { completed } = req.body as { completed: boolean };

    const { data, error } = await supabaseAdmin
      .from("oneshots")
      .update({ completed })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, name, created_at, completed")
      .single();

    if (error || !data) {
      console.error(error);
      return res.status(404).json({ error: "Failed to update one-shot" });
    }

    return res.json(data);
  }
);

// ===== Route: DELETE /api/oneshots/:id  (delete one-shot) =====
router.delete(
  "/:id",
  requireSupabaseAuth,
  async (req: SupabaseAuthRequest, res) => {
    const userId = req.userId!;
    const id = req.params.id;

    const { error } = await supabaseAdmin
      .from("oneshots")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete one-shot" });
    }

    return res.status(204).send();
  }
);

export default router;
