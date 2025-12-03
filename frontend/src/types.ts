// src/types.ts

export type MonsterStatBlock = {
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
  image?: string | null;   // 👈 NEW
};

export type ItemSummary = {
  name: string;
  type: string | null;
  rarity: string | null;
  desc: string | null;
};

export type OneShot = {
  title: string;
  hook: string;
  environment: string;
  partySize: number;
  averageLevel: number;
  monsters: MonsterStatBlock[];
  loot: ItemSummary[];
};

// what comes back from GET /api/oneshots
export type SavedOneShotSummary = {
  id: string;
  name: string;
  created_at: string;
  completed: boolean;
  notes?: string;
};

export type SavedOneShotDetail = {
  id: string;
  name: string;
  created_at: string;
  completed: boolean;
  data: OneShot;
  notes?: string;
};
