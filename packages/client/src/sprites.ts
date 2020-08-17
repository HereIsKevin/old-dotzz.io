export { BorderSprite, FoodSprite, PlayerSprite, Sprite };

import { defaultConfig as config } from "shared/config";
import { massToSize } from "shared/sprites";

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

  /* eslint-disable @typescript-eslint/no-unused-vars */
  public render(context: CanvasRenderingContext2D): void {
    throw new Error("render is not implemented");
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

class FoodSprite extends Sprite {
  public mass: number;

  public constructor(x: number, y: number) {
    super(x, y);

    this.mass = config.foodMass
  }

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgb(46, 204, 64)";

    context.beginPath();
    circle(context, this.x, this.y, massToSize(this.mass));
    context.fill();
  }
}

class PlayerSprite extends Sprite {
  public mass: number;
  public score: number;
  public name: string;
  public current: boolean;

  public constructor(
    x: number,
    y: number,
    mass: number,
    score: number,
    name: string,
    current: boolean
  ) {
    super(x, y);

    this.mass = mass;
    this.score = score;
    this.name = name;
    this.current = current;
  }

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.current ? "rgb(0, 116, 217)" : "rgb(255, 65, 54)";

    const size = massToSize(this.mass);

    context.beginPath();
    circle(context, this.x, this.y, size);
    context.fill();

    context.textAlign = "center";
    context.font = "12px sans-serif";
    context.fillText(String(this.score), this.x, this.y - (size + 6));

    context.textAlign = "center";
    context.font = "16px sans-serif";
    context.fillText(this.name, this.x, this.y - (size + 20));
  }
}

class BorderSprite extends Sprite {
  public direction: string;
  public target: HTMLCanvasElement;

  public constructor(
    x: number,
    y: number,
    target: HTMLCanvasElement,
    direction: string
  ) {
    super(x, y);

    this.target = target;
    this.direction = direction;
  }

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgb(221, 221, 221)";

    if (this.direction === "left") {
      context.fillRect(
        this.x - this.target.width,
        this.y - this.target.height,
        this.target.width,
        config.height + this.target.height * 2
      );
    } else if (this.direction === "right") {
      context.fillRect(
        this.x,
        this.y - this.target.height,
        this.target.width,
        config.height + this.target.height * 2
      );
    } else if (this.direction === "up") {
      context.fillRect(
        this.x - this.target.width,
        this.y - this.target.height,
        config.width + this.target.width * 2,
        this.target.height
      );
    } else if (this.direction === "down") {
      context.fillRect(
        this.x - this.target.width,
        this.y,
        config.width + this.target.width * 2,
        this.target.height
      );
    }
  }
}
