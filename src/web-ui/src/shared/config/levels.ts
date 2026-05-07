export type LevelCategory = 'basic' | 'noble' | 'divine';

export interface LevelConfig {
  name: string;
  requirement: number;
  reward: number;
  category: LevelCategory;
  milestone?: boolean;
  libraryReward?: number;
  icon: string;
}

export const LEVELS: LevelConfig[] = [
  { name: "1富", requirement: 10, reward: 50, category: "basic", icon: "/levels/1富.gif" },
  { name: "2富", requirement: 25, reward: 0, category: "basic", icon: "/levels/2富.gif" },
  { name: "3富", requirement: 50, reward: 0, category: "basic", icon: "/levels/3富.gif" },
  { name: "4富", requirement: 80, reward: 0, category: "basic", icon: "/levels/4富.gif" },
  { name: "5富", requirement: 120, reward: 0, category: "basic", icon: "/levels/5富.gif" },
  { name: "6富", requirement: 180, reward: 100, category: "basic", milestone: true, libraryReward: 1, icon: "/levels/6富.gif" },
  { name: "7富", requirement: 250, reward: 0, category: "basic", icon: "/levels/7富.gif" },
  { name: "8富", requirement: 350, reward: 0, category: "basic", icon: "/levels/8富.gif" },
  { name: "9富", requirement: 500, reward: 0, category: "basic", icon: "/levels/9富.gif" },
  { name: "10富", requirement: 700, reward: 0, category: "basic", milestone: true, libraryReward: 2, icon: "/levels/10富.gif" },
  { name: "男爵", requirement: 1000, reward: 3000, category: "noble", icon: "/levels/男爵.gif" },
  { name: "子爵", requirement: 1400, reward: 0, category: "noble", icon: "/levels/子爵.gif" },
  { name: "伯爵", requirement: 1900, reward: 0, category: "noble", icon: "/levels/伯爵.gif" },
  { name: "侯爵", requirement: 2500, reward: 0, category: "noble", icon: "/levels/侯爵.gif" },
  { name: "公爵", requirement: 3200, reward: 0, category: "noble", icon: "/levels/公爵.gif" },
  { name: "郡公", requirement: 4000, reward: 30000, category: "noble", milestone: true, libraryReward: 3, icon: "/levels/郡公.gif" },
  { name: "国公", requirement: 5000, reward: 0, category: "noble", icon: "/levels/国公.gif" },
  { name: "王爵", requirement: 6500, reward: 0, category: "noble", icon: "/levels/王爵.gif" },
  { name: "藩王", requirement: 8000, reward: 0, category: "noble", icon: "/levels/藩王.gif" },
  { name: "郡王", requirement: 10000, reward: 0, category: "noble", icon: "/levels/郡王.gif" },
  { name: "亲王", requirement: 12500, reward: 100000, category: "noble", milestone: true, libraryReward: 5, icon: "/levels/亲王.gif" },
  { name: "国王", requirement: 15500, reward: 0, category: "noble", icon: "/levels/国王.gif" },
  { name: "皇帝", requirement: 19000, reward: 0, category: "noble", icon: "/levels/皇帝.gif" },
  { name: "大帝", requirement: 23000, reward: 0, category: "noble", icon: "/levels/大帝.gif" },
  { name: "天君", requirement: 27500, reward: 0, category: "noble", icon: "/levels/天君.gif" },
  { name: "神", requirement: 32500, reward: 300000, category: "divine", milestone: true, libraryReward: 10, icon: "/levels/神.gif" },
  { name: "上神", requirement: 38000, reward: 0, category: "divine", icon: "/levels/上神.gif" },
  { name: "神皇", requirement: 44000, reward: 0, category: "divine", icon: "/levels/神皇.gif" },
  { name: "神尊", requirement: 50000, reward: 0, category: "divine", icon: "/levels/神尊.gif" },
  { name: "诸神之神", requirement: 60000, reward: 0, category: "divine", icon: "/levels/诸神之神.gif" },
  { name: "创世神", requirement: 70000, reward: 1000000, category: "divine", milestone: true, libraryReward: 20, icon: "/levels/创世神.gif" },
  { name: "未来神", requirement: 80000, reward: 0, category: "divine", icon: "/levels/未来神.gif" },
  { name: "神之始祖", requirement: 90000, reward: 0, category: "divine", icon: "/levels/神之始祖.gif" },
  { name: "万古神", requirement: 100000, reward: 0, category: "divine", icon: "/levels/万古神.gif" },
  { name: "宇宙之神", requirement: 120000, reward: 0, category: "divine", icon: "/levels/宇宙之神.gif" },
  { name: "自定义神", requirement: 150000, reward: 0, category: "divine", icon: "/levels/自定义神.gif" }
];

export function getLevelByPoints(points: number): LevelConfig {
  let result = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.requirement) {
      result = level;
    } else {
      break;
    }
  }
  return result;
}

export function getLevelByName(name: string): LevelConfig | undefined {
  return LEVELS.find(level => level.name === name);
}

export function getNextLevel(points: number): LevelConfig | null {
  for (const level of LEVELS) {
    if (level.requirement > points) {
      return level;
    }
  }
  return null;
}

export function getProgressToNextLevel(points: number): { current: number; required: number; percentage: number } | null {
  const currentLevel = getLevelByPoints(points);
  const nextLevel = getNextLevel(points);
  
  if (!nextLevel) {
    return null;
  }
  
  const current = points - currentLevel.requirement;
  const required = nextLevel.requirement - currentLevel.requirement;
  const percentage = Math.min(100, Math.round((current / required) * 100));
  
  return { current, required, percentage };
}
