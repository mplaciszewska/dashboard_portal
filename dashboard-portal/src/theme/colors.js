export const rgba = ([r, g, b, a]) => 
  `rgba(${r}, ${g}, ${b}, ${a})`;

export const colorPalette = [
    [113, 64, 0, 130],
    [161, 105, 40, 130],
    [189, 146, 90, 130],
    [214, 189, 141, 130],
    [235, 231, 168, 130],
    [162, 183, 165, 130],
    [121, 167, 172, 130],
    [36, 116, 138, 130],
    [26, 74, 87, 130]
];

export const colors = {
    primary: rgba([26, 74, 87, 130]), // dark teal
    secondary: rgba([128, 0, 32, 0.4]),
    secondaryOpaque: rgba([128, 0, 32, 1]), // burgundy
    background: rgba([240, 240, 240, 255]), // light gray
    backgroundDark: rgba([100, 100, 100, 255]), // darker gray
    success: rgba([2, 107, 69, 255]), // dark green 
}
