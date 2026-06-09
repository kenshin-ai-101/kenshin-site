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
      id: "section1_palace_cat_at_work",
      section: "section1",
      title: "故宫猫猫上班记",
      titleEn: "Palace Cats Clock In",
      year: "2025.1",
      posterPath: asset("/assets/posters/section1-palace-cat.webp"),
      videoPath: videoAsset("section1-palace-cat.mp4"),
      description: "北京日报的委托作品，获得 “我 AI 北京” 大师荣誉奖。受邀参加 TED2025、大阪世博会进行展映。",
      descriptionEn: "Commissioned by Beijing Daily. Winner of the “My AI Beijing” Master Honor Award, and selected for screenings at TED2025 and Expo 2025 Osaka.",
      client: "北京日报",
      clientEn: "Beijing Daily"
    },
    {
      id: "section1_civilized_cat_pudong",
      section: "section1",
      title: "文明小猫游浦东",
      titleEn: "A Civilized Kitten Tours Pudong",
      year: "2025.9",
      posterPath: asset("/assets/posters/section1-civilized-cat-pudong.webp"),
      videoPath: videoAsset("section1-civilized-cat-pudong.mp4"),
      description: "上海浦东新区文明办的委托作品，入选上海互联网优质内容创作项目。登上东方明珠十二连屏、正大广场大屏幕、陆家嘴地铁站超长屏。",
      descriptionEn: "Commissioned by the Pudong New Area Civilization Office. Selected for Shanghai’s quality online content program and shown across landmark public screens including Oriental Pearl Tower, Super Brand Mall, and Lujiazui Station.",
      client: "上海浦东新区文明办",
      clientEn: "Pudong New Area Civilization Office"
    },
    {
      id: "section1_cat_from_louvre",
      section: "section1",
      title: "来自卢浮宫的猫",
      titleEn: "The Cat from the Louvre",
      year: "2025.11",
      posterPath: asset("/assets/posters/section1-cat-from-louvre.webp"),
      videoPath: videoAsset("section1-cat-from-louvre.mp4"),
      description: "浦东美术馆 x 卢浮宫的委托作品，获得 2026 WAIFF 最佳广告片提名。登上浦东美术馆外滩大屏，和浦东许多写字楼。",
      descriptionEn: "Commissioned by Museum of Art Pudong x the Louvre. Nominated for Best Commercial Film at 2026 WAIFF, and shown on the MAP Bund-facing screen and office towers across Pudong.",
      client: "浦东美术馆 x 卢浮宫",
      clientEn: "Museum of Art Pudong x Louvre"
    },
    {
      id: "section2_old_swallow",
      section: "section2",
      title: "旧时王谢堂前燕",
      titleEn: "Swallows Before the Old Halls",
      year: "2026.3",
      posterPath: asset("/assets/posters/section2-old-swallow.webp"),
      videoPath: videoAsset("section2-old-swallow.mp4"),
      description: "北京国际电影节的委托作品，第16届北京国际电影节官方宣传片。",
      descriptionEn: "Commissioned by Beijing International Film Festival as the official promotional film for the 16th BJIFF.",
      client: "北京国际电影节",
      clientEn: "Beijing International Film Festival"
    },
    {
      id: "section2_beyond_frame",
      section: "section2",
      title: "画框之外",
      titleEn: "Beyond the Frame",
      year: "2025.7",
      posterPath: asset("/assets/posters/section2-beyond-frame.webp"),
      videoPath: videoAsset("section2-beyond-frame.mp4"),
      description: "快手可灵的委托作品，可灵多图参考模型的官方宣传片。获得第25届北京电影学院动画学院奖最佳AI影片银奖、2025 重庆流光绘影光影科技艺术节优秀作品奖。",
      descriptionEn: "Commissioned by Kling AI for the official multi-image reference model campaign. Winner of the Silver Award for Best AI Film at the 25th BFA Animation School Awards and an Excellence Award at the 2025 Chongqing Light & Shadow Technology Art Festival.",
      client: "快手可灵",
      clientEn: "Kling AI"
    },
    {
      id: "section2_pudong_coffee",
      section: "section2",
      title: "浦东你是一杯咖啡",
      titleEn: "Pudong, You Are a Cup of Coffee",
      year: "2025.10",
      posterPath: asset("/assets/posters/section2-pudong-coffee.webp"),
      videoPath: videoAsset("section2-pudong-coffee.mp4"),
      description: "陆家嘴国际咖啡文化节的委托作品，第10届咖啡节的官方宣传片。登上东方明珠十二连屏、正大广场大屏幕、陆家嘴地铁站超长屏。",
      descriptionEn: "Commissioned by Lujiazui International Coffee Culture Festival as the official film for its 10th edition, shown across major Pudong landmark screens.",
      client: "陆家嘴国际咖啡文化节",
      clientEn: "Lujiazui International Coffee Culture Festival"
    },
    {
      id: "section2_magic_assistant_cat",
      section: "section2",
      title: "咪：当魔术助理能起号吗",
      titleEn: "Meow: Can a Magic Assistant Go Viral?",
      year: "2026.3",
      posterPath: asset("/assets/posters/section2-magic-assistant-cat.webp"),
      videoPath: videoAsset("section2-magic-assistant-cat.mp4"),
      description: "红星美凯龙委托作品，红星美凯龙 315 嗨购节官方宣传片。",
      descriptionEn: "Commissioned by Red Star Macalline as the official promotional film for its 315 shopping festival campaign.",
      client: "红星美凯龙",
      clientEn: "Red Star Macalline"
    },
    {
      id: "section2_rabbit_hole_qiantan",
      section: "section2",
      title: "掉进前滩的兔子洞",
      titleEn: "Down the Qiantan Rabbit Hole",
      year: "2026.3",
      posterPath: asset("/assets/posters/section2-rabbit-hole-qiantan.webp"),
      videoPath: videoAsset("section2-rabbit-hole-qiantan.mp4"),
      description: "浦东前滩的委托作品，2026 上海国际花卉节官方宣传片。",
      descriptionEn: "Commissioned by Pudong Qiantan as the official promotional film for the 2026 Shanghai International Flower Festival.",
      client: "浦东前滩",
      clientEn: "Pudong Qiantan"
    },
    {
      id: "section2_wuhan_twelve_hours",
      section: "section2",
      title: "武汉十二时辰",
      titleEn: "Twelve Hours in Wuhan",
      year: "2025.10",
      posterPath: asset("/assets/posters/section2-wuhan-twelve-hours.webp"),
      videoPath: videoAsset("section2-wuhan-twelve-hours.mp4"),
      description: "火山引擎 x 武汉文旅的委托作品，为火山引擎在武汉的巡展制作的影片。",
      descriptionEn: "Commissioned by Volcano Engine x Wuhan Culture and Tourism for Volcano Engine’s Wuhan touring exhibition.",
      client: "火山引擎 x 武汉文旅",
      clientEn: "Volcano Engine x Wuhan Culture and Tourism"
    },
    {
      id: "section2_paintings_audition",
      section: "section2",
      title: "当名画来试镜",
      titleEn: "When Masterpieces Audition",
      year: "2025.10",
      posterPath: asset("/assets/posters/section2-paintings-audition.webp"),
      videoPath: videoAsset("section2-paintings-audition.mp4"),
      description: "Gaga AI 的委托作品，为 gaga.art 制作的宣传片。",
      descriptionEn: "Commissioned by Gaga AI as a promotional film for gaga.art.",
      client: "Gaga AI",
      clientEn: "Gaga AI"
    },
    {
      id: "section2_xiren_tour",
      section: "section2",
      title: "喜人奇妙夜 2026 全国巡演",
      titleEn: "Super Sketch Show 2026 National Tour",
      year: "2026.4",
      posterPath: asset("/assets/posters/section2-xiren-tour.webp"),
      videoPath: null,
      status: "touring",
      description: "Stand:by & 米未的委托作品。为喜人奇妙夜全国巡演制作的大屏视频内容。由于目前尚在巡演中，暂无法在线上播放。",
      descriptionEn: "Commissioned by Stand:by & MeWe for the large-screen content of the Super Sketch Show 2026 national tour. The piece is still touring and is not available for online playback yet.",
      client: "Stand:by & 米未",
      clientEn: "Stand:by & MeWe"
    }
  ] satisfies Work[],
  podcasts: [
    {
      id: "podcast_ci_hua_dang_zhen",
      section: "section3",
      show: "此话当真",
      title: "AIGC 创意、产品与投资的三重对谈：未来的皮克斯会诞生在 AI 公司里吗？",
      description: "一次关于 AIGC 创意、产品与投资的长谈，从创作者视角聊未来内容公司的样子。",
      coverPath: asset("/assets/podcasts/ci-hua-dang-zhen.png"),
      externalUrl: "https://www.xiaoyuzhoufm.com/episode/68065f181f1db84a56ba630e?s=eyJ1IjogIjYzMWUwNTgxZWRjZTY3MTA0YWVlZTdlYiJ9",
      platform: "xiaoyuzhou"
    },
    {
      id: "podcast_crossroads",
      section: "section3",
      show: "十字路口",
      title: "从医学院学生到一线AI艺术创作者｜和海辛聊视频生成工具、市场和几次人生的「十字路口」",
      description: "和海辛聊视频生成工具、创作市场，以及从医学院学生走到 AI 艺术创作者的几次转弯。",
      coverPath: asset("/assets/podcasts/crossroads.png"),
      externalUrl: "https://www.xiaoyuzhoufm.com/episode/67cd91020766616acdb292ea",
      platform: "xiaoyuzhou"
    }
  ] satisfies LinkItem[],
  tutorials: [
    {
      id: "tutorial_palace_cat",
      section: "section4",
      title: "《故宫猫猫上班记》超详细创作幕后分享",
      description: "从创意、镜头到 AI 视频生成流程，拆解《故宫猫猫上班记》的完整幕后。",
      coverPath: asset("/assets/posters/section1-palace-cat.webp"),
      externalUrl: "https://www.bilibili.com/video/BV1yZNHe3ETH/",
      platform: "bilibili",
      relatedWorkId: "section1_palace_cat_at_work"
    },
    {
      id: "tutorial_louvre_cat",
      section: "section4",
      title: "《来自卢浮宫的猫》超详细创作幕后分享",
      description: "围绕《来自卢浮宫的猫》的美术、叙事和制作方法，展开一场完整创作复盘。",
      coverPath: asset("/assets/posters/section1-cat-from-louvre.webp"),
      externalUrl: "https://bilibili.com/video/BV1puz9BWEDT/",
      platform: "bilibili",
      relatedWorkId: "section1_cat_from_louvre"
    }
  ] satisfies LinkItem[],
  socials: {
    github: "https://github.com/kenshin-ai-101?tab=repositories"
  },
  contact: {
    email: "kenshinshen1314@gmail.com"
  }
};

const boardPositions: Vec3[] = [
  [-14.2, 0, -1.4],
  [-11.4, 0, -5.4],
  [-7.2, 0, -9.2],
  [-2.7, 0, -11.6],
  [2.7, 0, -11.6],
  [7.2, 0, -9.2],
  [-15.2, 0, 3.2],
  [14.2, 0, -1.4],
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
    title: "金融IT转向AI从业者",
    titleEn: "From Financial IT to AI Practitioner",
    body: ["2005-2009  浙江传媒学院 电子信息工程 本科", "2014-2025 恒生电子股份有限公司 金融产品维护经理", "2025-至今 转型AI 独立开发者\内容创作", "这条路没有按常规路线走到终点，但它刚好构成了现在的我。"]
  },
  C: {
    artifact: "一串绑在一起的通行证",
    label: "通行证",
    title: "切换的职业频道",
    titleEn: "Channels I Have Moved Through",
    body: ["2009-2012 杭州西软科技限公司 项目经理", "2012-2014 信雅达数码科技 项目经理", "2024-2025 恒生电子股份有限公司 金融产品维护经理", "2025 至今  转型AI 独立开发者\内容创作", "打工的轨迹结束了，录像带被切到最新的画面。"]
  },
  D: {
    artifact: "撕下来的书页一角",
    label: "书页一角",
    title: "几股审美洋流",
    titleEn: "A Few Currents Under the Surface",
    body: ["喜欢的作者：刘慈欣、加缪、安.兰德", "这大概就是我大脑里几股交汇的洋流，也是我审美的底色。"]
  },
  E: {
    artifact: "弹出的全息成就面板",
    label: "全息面板",
    title: "独立开发\内容创作者",
    titleEn: "Independent dev/content creators",
    body: ["独立开发了剧本创作工具、Web版Claude code、食之书、收录高审美网站的导航站"],
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
  { id: "social:github", type: "social", label: "GitHub", socialKey: "github", position: [-3.2, 0, 7.7], radius: 2.35 }
] satisfies WorldTarget[];

export const worldTargets: WorldTarget[] = [
  { id: "cinema", type: "cinema", label: "马戏影院", position: [0, 1.2, -3.8], radius: 6.8 },
  { id: "contact", type: "contact", label: "合作小铺", position: [8.4, 0.9, 7], radius: 3.8 },
  { id: "guide:nika", type: "guide", label: "向导尼卡", position: [6, 0.9, 7.9], radius: 1.75 },
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
  title: "向导尼卡",
  text: "（尼卡把斗篷边缘理顺，眼睛亮起来。）欢迎来到剑心的作品世界，我是向导尼卡。请把脚步放轻一点，这里的海报会在风里翻身，帐篷会把故事放映成星星；如果你听见喷泉在小声念诗，那不是错觉，是它今天心情很好。"
};

export const guideLines = [
  {
    title: "向导尼卡",
    text: "（尼卡把尾巴绕成一个问号。）你又来啦？我刚刚替喷泉数完第七圈涟漪。往左会遇见一些会眨眼的作品，往右有一间摊位，专门收留还没说出口的合作念头。"
  },
  {
    title: "向导尼卡",
    text: "（尼卡认真地压低声音。）小秘密：有些展板看起来很安静，其实背后都藏着一只正在剪片的月亮。靠近一点，按下互动键，它们就会把门打开。"
  },
  {
    title: "向导尼卡",
    text: "（尼卡像导游一样抬起爪子。）如果你迷路了，就跟着帐篷的颜色走。粉色负责梦，蓝色负责风，黄色负责把今天照亮。至于我，负责假装自己很懂路线。"
  },
  {
    title: "向导尼卡",
    text: "（尼卡甩了甩斗篷边缘。）重复拜访是被允许的。故事不是一次性用品，它会在第二次、第三次路过时，把口袋里的小纸条递给你。"
  },
  {
    title: "向导尼卡",
    text: "（尼卡看向远处的展板。）剑心把很多奇怪又温柔的东西放在这里：猫、巡演、城市屏幕、偶尔还有一点不肯下班的灵感。你可以慢慢看，不用赶路。"
  }
];
