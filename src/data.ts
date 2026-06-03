import { asset, videoAsset } from "./assets";

export type Vec3 = [number, number, number];

export type Work = {
  id: string;
  section: "section1" | "section2";
  title: string;
  titleEn: string;
  year: string;
  posterPath: string;
  videoPath: string | null;
  status?: "touring";
  description: string;
  descriptionEn: string;
  client: string;
  clientEn: string;
};

export type LinkItem = {
  id: string;
  section: string;
  title: string;
  description: string;
  coverPath: string;
  externalUrl: string;
  platform: string;
  show?: string;
  relatedWorkId?: string;
};

export type Sculpture = {
  artifact: string;
  label: string;
  title: string;
  titleEn: string;
  body: string[];
  highlights?: string[];
  note?: string;
  code: string;
  targetId: string;
  position: Vec3;
  rotationY: number;
};

export type WorldTarget =
  | { id: string; type: "work"; label: string; workId: string; position: Vec3; radius: number }
  | { id: string; type: "cinema" | "contact" | "podcasts" | "tutorials" | "guide"; label: string; position: Vec3; radius: number }
  | { id: string; type: "sculpture"; label: string; sculptureCode: string; position: Vec3; radius: number }
  | { id: string; type: "social"; label: string; socialKey: keyof typeof portfolio.socials; position: Vec3; radius: number };

export const portfolio = {
  works: [
    {
      id: "section1_codepilot_web",
      section: "section1",
      title: "Codepilot",
      titleEn: "Codepilot",
      year: "2026.4",
      posterPath: asset("/assets/posters/section1-codepilot-web.webp"),
      videoPath: videoAsset("section1-codepilot-web.mp4"),
      description: "CodePilot 从编程工具起步，已成长为通用 AI Agent 桌面客户端：\nAssistant Workspace — 人设、持久记忆、Onboarding引导和每日签到。你的助理会学习你的偏好并持续适应。\n生成式 UI — AI 可以创建交互式仪表盘、图表和可视化组件，在应用内实时渲染。\n远程 Bridge — 连接 Tg、飞书、Discord、QQ。在手机上发消息，在桌面上收回复。\n MCP+Skills — 添加MCP服务器（stdio/sse/http），支持运行时监控。定义可复用技能或从 skills.sh 市场安装。\nMedia Studio — AI图片生成，支持批量生图。",
      descriptionEn: "CodePilot started as a programming tool and has grown into a general AI Agent desktop client: Assistant Workspace — Persona, persistent memory, onboarding guidance, and daily check-in. Your assistant will learn your preferences and adapt continuously. Generative UI — AI can create interactive dashboards, charts, and visual components that render in real-time within the application. Remote Bridge — Connect Telegram, Feishu, Discord, QQ. Send messages on your phone and receive replies on your desktop. MCP+Skills — Add MCP servers (stdio/sse/http) for runtime monitoring. Define reusable skills or install from the skills.sh market. Media Studio — AI image generation, supporting batch tasks, galleries, and tag management.",
      client: "",
      clientEn: ""
    },
    {
      id: "section1_script_gen_ai",
      section: "section1",
      title: "剧本生成Agent",
      titleEn: "A Script Generation Agent",
      year: "2026.5",
      posterPath: asset("/assets/posters/section1-script-gen-ai.webp"),
      videoPath: videoAsset("section1-script-gen-ai.mp4"),
      description: "提供完整的影视幕后工作流 SaaS 系统——实时协作剧本编辑器配全剧本 AI 上下文，AI 一键生成人物小传、关系图谱、海报、角色画像、分场分镜，到 AI 美术设计、演员表管理、勘景管理、预算管理，涵盖前期幕后工作的所有专业设施。让创作团队在统一平台高效协作。一切只为加速人类剧作与影像艺术发展进程。",
      descriptionEn: "A complete pre-production SaaS—real-time collaborative screenplay editor with full-script AI context, plus AI-derived scene breakdowns, storyboards, character bios, relationship graphs, posters, cast management, location scouting, and budgeting. One platform for your entire writers' room. Built to accelerate human storytelling.",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_cat_from_louvre",
      section: "section1",
      title: "待添加作品",
      titleEn: "Coming Soon",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_beyond_frame",
      section: "section2",
      title: "待添加作品",
      titleEn: "Coming Soon",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_pudong_coffee",
      section: "section2",
      title: "待添加作品",
      titleEn: "Coming Soon",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_magic_assistant_cat",
      section: "section2",
      title: "待添加作品",
      titleEn: "Coming Soon",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    },
    {
      id: "section2_kenshin_tools_wall",
      section: "section2",
      title: "剑心的军火库",
      titleEn: "Down the Qiantan Rabbit Hole",
      year: "2026.5",
      posterPath: asset("/assets/posters/section2-kenshin-tools-wall.webp"),
      videoPath: videoAsset("section2-kenshin-tools-wall.mp4"),
      description: "不是爬虫爬的合集 ⚔️不是随意收的合集 🐝自己一路的积累一个一个手动拷贝 🐝记录在我notion的 🦋很多跟审美相关 🦠也跟AI艺术相关 做个酷网页",
      descriptionEn: "This isn't a collection scraped by a web crawler ⚔️ It's not a random collection either 🐝 It's a collection I accumulated myself, manually copied one by one 🐝 Recorded on my Notion 🦋 Much of it is related to aesthetics 🦠 It's also related to AI art. To create a cool website.",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_1",
      section: "section2",
      title: "待添加作品1",
      titleEn: "Coming Soon 1",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_2",
      section: "section2",
      title: "待添加作品2",
      titleEn: "Coming Soon 2",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_3",
      section: "section2",
      title: "待添加作品3",
      titleEn: "Coming Soon 3",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    },
    {
      id: "placeholder_4",
      section: "section2",
      title: "待添加作品4",
      titleEn: "Coming Soon 4",
      year: "",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: null,
      description: "作品陆续添加中",
      descriptionEn: "More works coming soon",
      client: "",
      clientEn: ""
    }
  ] satisfies Work[],
  podcasts: [

  ] satisfies LinkItem[],
  tutorials: [

  ] satisfies LinkItem[],
  socials: {
    github: "https://github.com/kenshinshen1314-sudo?tab=repositories",
    jike: "",
    xiaohongshu: "",
    twitter: ""
  },
  contact: {
    email: "kenshinshen1314@gmail.com"
  }
};

const boardPositions: Vec3[] = [
  [-14.2, 0, -1.4],
  [-11.4, 0, -5.4],
  [-15.2, 0, 3.2],
  [14.2, 0, -1.4],
  [2.7, 0, -11.6],
  [7.2, 0, -9.2],
  [-7.2, 0, -9.2],
  [-2.7, 0, -11.6],
  [11.4, 0, -5.4],
  [15.2, 0, 3.2],
  [0, 0, -14]
];

export const workLayouts = portfolio.works.map((work, index) => {
  const [x, , z] = boardPositions[index] ?? ([0, 0, -12 - index * 1.2] as Vec3);
  const height = 2.75 + (index % 4) * 0.24;
  return {
    work,
    targetId: `work:${work.id}`,
    position: [x, height / 2 + 0.2, z] as Vec3,
    rotationY: Math.atan2(-x, 1.5 - z),
    height
  };
});

const faceCenter = ([x, , z]: Vec3) => Math.atan2(-x, 1.5 - z);

const sculptureCopy = {
  A: {
    artifact: "一张磨损的身份卡",
    label: "身份卡",
    title: "AI Beginner",
    titleEn: "AI Beginner",
    body: ["嗨，我叫剑心，临海长大，杭州求学，现居杭州，是一名AI萌新。"]
  },
  B: {
    artifact: "一份折叠过的履历",
    label: "折叠履历",
    title: "金融IT转向AI",
    titleEn: "From Financial IT to AI",
    body: ["2005-2009 浙江传媒学院 电子信息工程 本科", "2014-2025 恒生电子股份有限公司 金融产品维护经理", "2025-至今 转型AI 独立开发和内容创作", "这条路没有按常规路线走到终点，但它刚好构成了现在的我。"]
  },
  C: {
    artifact: "一串绑在一起的通行证",
    label: "通行证",
    title: "切换的职业频道",
    titleEn: "Channels I Have Moved Through",
    body: ["2009-2012 杭州西软科技限公司 项目经理", "2012-2014 信雅达数码科技 项目经理", "2024-2025 恒生电子股份有限公司 金融产品维护经理", "2025 至今  转型AI 独立开发和内容创作", "打工的轨迹结束了，录像带被切到最新的画面。"]
  },
  D: {
    artifact: "撕下来的书页一角",
    label: "书页一角",
    title: "几股审美洋流",
    titleEn: "A Few Currents Under the Surface",
    body: ["喜欢的作者：刘慈欣、Isaac Asimov、Arthur Charles Clarke、加缪、安.兰德", "这大概就是我大脑里几股交汇的洋流，也是我审美的底色。"]
  },
  E: {
    artifact: "弹出的全息成就面板",
    label: "全息面板",
    title: "独立开发&&内容创作者",
    titleEn: "Independent dev/content creators",
    body: ["独立开发了剧本创作工具Laper.ai、Web版Claudecode、食之书、收录高审美网站的导航站"],
    note: ""
  }
} satisfies Record<string, Omit<Sculpture, "code" | "targetId" | "position" | "rotationY">>;

function sculpture(code: keyof typeof sculptureCopy, position: Vec3): Sculpture {
  return {
    ...sculptureCopy[code],
    code,
    targetId: `sculpture:${code}`,
    position,
    rotationY: faceCenter(position)
  };
}

export const sculptures = [
  sculpture("A", [-12.8, 0, -3.35]),
  sculpture("B", [-9.25, 0, -7.3]),
  sculpture("C", [-4.95, 0, -10.35]),
  sculpture("D", [4.95, 0, -10.35]),
  sculpture("E", [9.25, 0, -7.3])
];

export const socialTargets = [
  { id: "social:github", type: "social", label: "GitHub", socialKey: "github", position: [-3.2, 0, 7.7], radius: 2.35 },
  { id: "social:jike", type: "social", label: "即刻", socialKey: "jike", position: [-5.8, 0, 10.2], radius: 2.35 },
  { id: "social:xiaohongshu", type: "social", label: "小红书", socialKey: "xiaohongshu", position: [-1.8, 0, 10.8], radius: 2.35 },
  { id: "social:twitter", type: "social", label: "Twitter", socialKey: "twitter", position: [-9.6, 0, 9.4], radius: 2.35 }
] satisfies WorldTarget[];

export const worldTargets: WorldTarget[] = [
  { id: "cinema", type: "cinema", label: "马戏影院", position: [0, 1.2, -3.8], radius: 6.8 },
  { id: "contact", type: "contact", label: "合作小铺", position: [8.4, 0.9, 7], radius: 3.8 },
  { id: "guide:nika", type: "guide", label: "向导Jarvis", position: [6, 0.9, 7.9], radius: 1.75 },
  { id: "podcasts:radio", type: "podcasts", label: "小电台", position: [11.35, 0.45, 8.55], radius: 2.45 },
  { id: "tutorials:book", type: "tutorials", label: "制作手册", position: [-4.85, 0.35, -2.3], radius: 2.35 },
  ...socialTargets,
  ...sculptures.map((item) => ({
    id: item.targetId,
    type: "sculpture" as const,
    label: item.label,
    sculptureCode: item.code,
    position: item.position,
    radius: 2.2
  })),
  ...workLayouts.map((item) => ({
    id: item.targetId,
    type: "work" as const,
    label: item.work.title,
    workId: item.work.id,
    position: item.position,
    radius: 3.15
  }))
];

export const firstGuideLine = {
  title: "向导Jarvis",
  text: "（Jarvis把斗篷边缘理顺，眼睛亮起来。）欢迎来到剑心的作品世界，我是向导Jarvis。请把脚步放轻一点，这里的海报会在风里翻身，帐篷会把故事放映成星星；如果你听见喷泉在小声念诗，那不是错觉，是它今天心情很好。"
};

export const guideLines = [
  {
    title: "向导Jarvis",
    text: "（Jarvis把尾巴绕成一个问号。）你又来啦？我刚刚替喷泉数完第七圈涟漪。往左会遇见一些会眨眼的作品，往右有一间摊位，专门收留还没说出口的合作念头。"
  },
  {
    title: "向导Jarvis",
    text: "（Jarvis认真地压低声音。）小秘密：有些展板看起来很安静，其实背后都藏着一只正在剪片的月亮。靠近一点，按下互动键，它们就会把门打开。"
  },
  {
    title: "向导Jarvis",
    text: "（Jarvis像导游一样抬起爪子。）如果你迷路了，就跟着帐篷的颜色走。粉色负责梦，蓝色负责风，黄色负责把今天照亮。至于我，负责假装自己很懂路线。"
  },
  {
    title: "向导Jarvis",
    text: "（Jarvis甩了甩斗篷边缘。）重复拜访是被允许的。故事不是一次性用品，它会在第二次、第三次路过时，把口袋里的小纸条递给你。"
  },
  {
    title: "向导Jarvis",
    text: "（Jarvis看向远处的展板。）剑心把很多奇怪又温柔的东西放在这里：猫、巡演、城市屏幕、偶尔还有一点不肯下班的灵感。你可以慢慢看，不用赶路。"
  }
];
