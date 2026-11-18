/* Curated Unsplash interior photography (stable source URLs). */
const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  livingLuxury: u("1618221195710-dd6b41faaea6"),
  livingModern: u("1586023492125-27b2c045efd7"),
  livingWarm: u("1600607687939-ce8a6c25118c"),
  bedroom1: u("1600210492486-724fe5c67fb0"),
  bedroom2: u("1616594039964-ae9021a400a0"),
  kitchen1: u("1617103996702-96ff29b1c467"),
  kitchen2: u("1600489000022-c2086d79f9d4"),
  villa: u("1600585154340-be6161a56a0c"),
  penthouse: u("1600566753086-00f18fb6b3ea"),
  diningRoom: u("1617806118233-18e1de247200"),
  bathroom: u("1600566752355-35792bedcfea"),
  office: u("1497366216548-37526070297c"),
} as const;

/* Material / texture imagery */
export const MATERIAL_IMG = {
  marble: u("1618219908412-a29a1bb7b86e", 600),
  wood: u("1520038410233-7141be7e6f97", 600),
  tiles: u("1600566752229-250ed79470f8", 600),
  fabric: u("1567016376408-0226e4d0c1ea", 600),
  lighting: u("1513506003901-1e6a229e2d15", 600),
  paint: u("1562259949-e8e7689d7828", 600),
  furniture: u("1555041469-a586c61ea9bc", 600),
  flooring: u("1581858726788-75bc0f6a952d", 600),
  wallpaper: u("1615529182904-14819c35db37", 600),
  hardware: u("1600607688969-a5bfcd646154", 600),
  curtains: u("1600210491369-e753d80a41f3", 600),
  granite: u("1604709177225-055f99402ea3", 600),
} as const;

/* Moodboard reference tiles */
export const MOOD_IMG = [
  u("1618221195710-dd6b41faaea6", 700),
  u("1567016376408-0226e4d0c1ea", 700),
  u("1513506003901-1e6a229e2d15", 700),
  u("1616486338812-3dadae4b4ace", 700),
  u("1555041469-a586c61ea9bc", 700),
  u("1522771739844-6a9f6d5f14af", 700),
  u("1584622650111-993a426fbf0a", 700),
  u("1532372320572-cda25653a26d", 700),
  u("1524758631624-e2822e304c36", 700),
  u("1583847268964-b28dc8f51f92", 700),
];

export const AVATARS = [
  u("1494790108377-be9c29b29330", 200),
  u("1507003211169-0a1dd7228f2d", 200),
  u("1438761681033-6461ffad8d80", 200),
  u("1500648767791-00dcc994a43e", 200),
  u("1544005313-94ddf0286df2", 200),
];
