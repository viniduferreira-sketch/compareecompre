export type CategoryBlobColor = "electronics" | "fashion" | "home" | "phones" | "games" | "beauty" | "sports";

const shapes = {
  1: "M28 66C38 27 85 12 131 17C174 21 207 45 200 85C194 126 145 146 98 141C49 137 15 110 28 66Z",
  2: "M23 76C19 38 65 17 110 20C158 23 205 34 204 77C203 119 163 143 116 142C68 142 27 118 23 76Z",
  3: "M30 49C55 18 97 12 142 24C184 35 209 68 194 107C180 143 135 148 90 137C45 126 5 81 30 49Z",
};

export function CategoryBlob({ color, variant }: { color: CategoryBlobColor; variant: 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 220 160" className="category-blob" data-color={color} aria-hidden="true" focusable="false">
      <path d={shapes[variant]} />
    </svg>
  );
}