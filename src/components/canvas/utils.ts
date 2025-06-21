
export const getCanvasCoordinates = (
  event: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
};

export const isPointInPolygon = (point: [number, number], polygon: number[][]) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

export const fitImageToContainer = (
  canvas: HTMLCanvasElement,
  container: HTMLDivElement,
  img: HTMLImageElement
) => {
  const containerRect = container.getBoundingClientRect();
  const scaleX = containerRect.width / img.width;
  const scaleY = containerRect.height / img.height;
  const newScale = Math.min(scaleX, scaleY, 1);
  
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.style.width = `${img.width * newScale}px`;
  canvas.style.height = `${img.height * newScale}px`;
  
  return newScale;
};
