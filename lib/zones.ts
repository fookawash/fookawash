export const KOLKATA_ZONES = [
  "Salt Lake",
  "New Town / Rajarhat",
  "Lake Town / Bangur / Kestopur",
  "Dum Dum / Nagerbazar",
  "North Kolkata (Shyambazar / Girish Park)",
  "Central Kolkata (Park Street / Esplanade)",
  "South Kolkata (Ballygunge / Gariahat)",
  "Jadavpur / Tollygunge / Garia",
  "Behala / Alipore",
] as const;

export type KolkataZone = (typeof KOLKATA_ZONES)[number];