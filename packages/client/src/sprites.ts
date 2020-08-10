export { BorderSprite, Sprite, PlayerSprite };

import { Config, defaultConfig } from "shared/config";

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
  public direction: string;
  public target: HTMLCanvasElement;
  public config: Config;

  public constructor(
    x: number,
    y: number,
    target: HTMLCanvasElement,
    direction: string,
    config: Config = defaultConfig
  ) {
    super(x, y);

    this.target = target;
    this.direction = direction;
    this.config = { ...defaultConfig, ...config };
  }

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgb(221, 221, 221)";

    if (this.direction === "left") {
      context.fillRect(
        this.x - this.target.width,
        this.y - this.target.height,
        this.target.width,
        this.config.height + this.target.height * 2
      );
    } else if (this.direction === "right") {
      context.fillRect(
        this.x,
        this.y - this.target.height,
        this.target.width,
        this.config.height + this.target.height * 2
      );
    } else if (this.direction === "up") {
      context.fillRect(
        this.x - this.target.width,
        this.y - this.target.height,
        this.config.width + this.target.width * 2,
        this.target.height
      );
    } else if (this.direction === "down") {
      context.fillRect(
        this.x - this.target.width,
        this.y,
        this.config.width + this.target.width * 2,
        this.target.height
      );
    }
  }
}
