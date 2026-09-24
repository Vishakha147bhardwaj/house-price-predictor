// Free photos from Unsplash (Unsplash License). Credited in the footer.
// Each photo lists backups: if one image is removed from Unsplash, the next one is used.
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

const KNOWN_GOOD = u("1600596542815-ffad4c1539a9");

export type Photo = { srcs: string[]; alt: string; credit: string };

export const PHOTOS = {
  hero: {
    srcs: [u("1613977257365-aaae5a9817ff"), u("1512917774080-9991f1c4c750"), u("1706808849780-7a04fbac83ef"), KNOWN_GOOD],
    alt: "White modern villa with a swimming pool",
    credit: "John Fornander",
  },
  coastal: { srcs: [KNOWN_GOOD], alt: "Modern white house under a blue sky", credit: "Frames For Your Heart" },
  hillside: {
    srcs: [u("1756435292384-1bf32eff7baf"), u("1505843513577-22bb7d21e455"), u("1599409637219-d04e9a2db432"), u("1544984243-ec57ea16fe25")],
    alt: "Modern house with stone accents at sunset",
    credit: "Justin Wolff",
  },
  golden: { srcs: [u("1544984243-ec57ea16fe25"), KNOWN_GOOD], alt: "Pool beside a house at golden hour", credit: "Roberto Nickson" },
  classic: {
    srcs: [u("1580587771525-78b9dba3b914"), u("1561026554-29d9815d4f3d"), u("1591474200742-8e512e6f98f8"), KNOWN_GOOD],
    alt: "White and wood family home",
    credit: "Ярослав Алексеенко",
  },
  modern: {
    srcs: [u("1512917774080-9991f1c4c750"), u("1706808849780-7a04fbac83ef"), KNOWN_GOOD],
    alt: "White modern home beside a pool",
    credit: "Frames For Your Heart",
  },
  interior: { srcs: [u("1613545325278-f24b0cae1224"), KNOWN_GOOD], alt: "Bright living room in neutral tones", credit: "Zac Gudakov" },
} satisfies Record<string, Photo>;

export function tierFor(price: number): { name: string; note: string; photo: Photo } {
  if (price < 250_000) return { name: "Classic Residence", note: "An accessible, established neighbourhood", photo: PHOTOS.classic };
  if (price < 450_000) return { name: "Modern Home", note: "A sought-after, well-connected neighbourhood", photo: PHOTOS.modern };
  return { name: "Signature Estate", note: "One of California's most coveted neighbourhoods", photo: PHOTOS.hero };
}
