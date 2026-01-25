from dataclasses import dataclass

@dataclass
class PolandBbox2180:
    minx: int = 115_000
    miny: int = 95_000
    maxx: int = 825_000
    maxy: int = 905_000
    step: int = 35_000

    def generate_bboxes(self, custom_step: int | None = None):
        step = custom_step if custom_step is not None else self.step
        bboxes = []
        x = self.minx
        while x < self.maxx:
            y = self.miny
            while y < self.maxy:
                bbox = (
                    x,
                    y,
                    min(x + step, self.maxx),
                    min(y + step, self.maxy)
                )
                bboxes.append(bbox)
                y += step
            x += step
        return bboxes
    
    @staticmethod
    def calculate_optimal_step(feature_count: int, default_step: int = 35_000) -> int:
        if feature_count < 300_000:
            return 100_000
        elif feature_count < 800_000:
            return 50_000
        else:
            return default_step

    