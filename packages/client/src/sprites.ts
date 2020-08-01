export { Sprite, Basic };

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

class Basic extends Sprite {
  public render(context: CanvasRenderingContext2D) {
    context.fillStyle = "rgb(0, 0, 0)";

    context.beginPath();
    circle(context, this.x, this.y, 20);
    context.fill();
  }
}
