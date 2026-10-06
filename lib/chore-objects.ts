import { ChoreType } from './types';

// Mapping COCO-SSD detected class names to relevant chore types
// COCO-SSD can detect 80 object classes from the MS COCO dataset

export const CHORE_OBJECT_MAP: Record<string, ChoreType[]> = {
  // Kitchen / Cleaning objects
  'bottle': ['mop', 'trash'],
  'cup': ['mop', 'trash'],
  'bowl': ['mop', 'trash'],
  'wine glass': ['mop'],
  'fork': ['mop'],
  'knife': ['mop'],
  'spoon': ['mop'],
  'dining table': ['mop', 'vacuum'],
  'sink': ['mop'],
  'oven': ['mop'],
  'microwave': ['mop'],
  'refrigerator': ['mop'],
  'toaster': ['mop'],

  // Trash / Clutter
  'book': ['trash'],
  'cell phone': ['trash'],
  'remote': ['trash'],
  'keyboard': ['trash'],
  'mouse': ['trash'],
  'laptop': ['trash'],
  'backpack': ['trash', 'laundry'],
  'handbag': ['trash'],
  'suitcase': ['trash', 'laundry'],
  'umbrella': ['trash'],
  'vase': ['mop', 'trash'],
  'scissors': ['trash'],
  'teddy bear': ['trash', 'laundry'],
  'sports ball': ['trash'],
  'baseball glove': ['trash', 'laundry'],
  'skateboard': ['trash'],
  'surfboard': ['trash'],
  'tennis racket': ['trash'],
  'frisbee': ['trash'],

  // Laundry
  'tie': ['laundry'],
  'person': ['laundry'], // people may indicate clothes around

  // Floor / Vacuum areas
  'chair': ['vacuum'],
  'couch': ['vacuum', 'laundry'],
  'bed': ['vacuum', 'laundry'],
  'potted plant': ['vacuum', 'mop'],
  'tv': ['mop'],
  'clock': ['mop'],

  // Pets (vacuum related)
  'cat': ['vacuum'],
  'dog': ['vacuum'],
};

// Get a friendly label for detected objects based on chore type
export function getChoreLabel(className: string, choreType: ChoreType): string {
  const labels: Record<string, Record<string, string>> = {
    vacuum: {
      'chair': '🪑 Under chair',
      'couch': '🛋️ Behind couch',
      'bed': '🛏️ Under bed',
      'dining table': '🍽️ Under table',
      'potted plant': '🌱 Around plant',
      'cat': '🐱 Cat hair zone!',
      'dog': '🐕 Dog fur zone!',
    },
    mop: {
      'cup': '☕ Cup ring · Wipe me!',
      'bowl': '🥣 Spill zone',
      'bottle': '🍶 Drip spot',
      'dining table': '🍽️ Table · Wipe down!',
      'sink': '🚰 Sink · Scrub me!',
      'tv': '📺 Dusty screen',
      'wine glass': '🍷 Glass ring',
    },
    trash: {
      'bottle': '🍶 Recycle me!',
      'cup': '☕ Toss me!',
      'book': '📚 Put away!',
      'remote': '📱 Misplaced!',
      'backpack': '🎒 Stow away',
      'cell phone': '📱 Put back!',
    },
    laundry: {
      'tie': '👔 Needs washing',
      'backpack': '🎒 Check pockets!',
      'couch': '🛋️ Couch clothes!',
      'bed': '🛏️ Change sheets!',
      'teddy bear': '🧸 Wash me!',
    },
  };

  return labels[choreType]?.[className] ?? `${className} · Clean me!`;
}

// Check if a detected object is relevant to the selected chore type
export function isRelevantObject(className: string, choreType: ChoreType): boolean {
  const relevant = CHORE_OBJECT_MAP[className];
  return !!relevant && relevant.includes(choreType);
}
