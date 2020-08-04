export { Sprite, PlayerSprite };

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

class PlayerSprite extends Sprite {
  public current: boolean;

  public constructor(x: number, y: number) {
    super(x, y);

    this.current = false;
  }

  public render(context: CanvasRenderingContext2D) {
    context.fillStyle = this.current ? "rgb(0, 116, 217)" : "rgb(255, 65, 54)";

    context.beginPath();
    circle(context, this.x, this.y, 20);
    context.fill();
  }
}
