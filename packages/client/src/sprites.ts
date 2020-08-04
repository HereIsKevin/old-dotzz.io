export { BorderSprite, Sprite, PlayerSprite };

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

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.current ? "rgb(0, 116, 217)" : "rgb(255, 65, 54)";

    context.beginPath();
    circle(context, this.x, this.y, 20);
    context.fill();
  }
}

class BorderSprite extends Sprite {
  public direction: "left" | "right" | "up" | "down";
  public target?: HTMLCanvasElement;

  public constructor(x: number, y: number) {
    super(x, y);

    this.direction = "left";
    this.target = undefined;
  }

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgb(221, 221, 221)";

    if (typeof this.target === "undefined") {
      return;
    }

    if (this.direction === "left") {
      context.fillRect(
        this.x - this.target.width,
        this.y - this.target.height,
        this.target.width,
        1000 + (this.target.height * 2)
      );
    } else if (this.direction === "right") {
      context.fillRect(
        this.x,
        this.y - this.target.height,
        this.target.width,
        1000 + (this.target.height * 2)
      );
    } else if (this.direction === "up") {
      context.fillRect(
        this.x - this.target.width,
        this.y - this.target.height,
        1000 + (this.target.width * 2),
        this.target.height
      );
    } else if (this.direction === "down") {
      context.fillRect(
        this.x - this.target.width,
        this.y,
        1000 + (this.target.width * 2),
        this.target.height
      );
    }
  }
}
