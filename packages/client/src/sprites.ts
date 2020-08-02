export { Sprite, Person };

function randint(min: number, max: number) {
  const roundedMin = Math.ceil(min);
  const roundedMax = Math.floor(max);

  return Math.floor(Math.random() * (roundedMax - roundedMin)) + roundedMin;
}

function circle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
): void {
  context.arc(x, y, radius, 0, 2 * Math.PI);
}

class Sprite {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public render(context: CanvasRenderingContext2D): void {
    throw new Error("render is not implemented");
  }
}

class Person extends Sprite {
  private color: string;

  public constructor(x: number, y: number) {
    super(x, y);

    this.color = `rgb(${randint(0, 256)}, ${randint(0, 256)}, ${randint(
      0,
      256
    )})`;
  }

  public render(context: CanvasRenderingContext2D) {
    context.fillStyle = this.color;

    context.beginPath();
    circle(context, this.x, this.y, 20);
    context.fill();
  }
}
