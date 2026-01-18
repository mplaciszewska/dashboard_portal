from dataclasses import dataclass

@dataclass
class PolandBbox2180:
    minx: int = 115_000
    miny: int = 95_000
    maxx: int = 825_000
    maxy: int = 905_000
    step: int = 50_000

    def generate_bboxes(self):
        bboxes = []
        x = self.minx
        while x < self.maxx:
            y = self.miny
            while y < self.maxy:
                bbox = (
                    x,
                    y,
                    min(x + self.step, self.maxx),
                    min(y + self.step, self.maxy)
                )
                bboxes.append(bbox)
                y += self.step
            x += self.step
        return bboxes

    