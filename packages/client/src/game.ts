export { Game };

const keyEvents = ["keydown", "keyup"];

interface EventMap {
  keydown: KeyboardEvent;
  keyup: KeyboardEvent;
  [key: string]: Event;
}

class Game {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;

  public tasks: (() => void)[];

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // setup canvas context
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("could not initialize canvas");
    }

    this.context = context;

    // setup automatic resize
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;

    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });

    // setup tasks
    this.tasks = [];

    // bind render for request animation frame
    this.render = this.render.bind(this);
  }

  public on<K extends keyof EventMap & string>(
    event: K,
    handler: (event: EventMap[K]) => void
  ): void {
    if (keyEvents.includes(event)) {
      window.addEventListener(event, handler);
    } else {
      this.canvas.addEventListener(event, handler);
    }
  }

  private render() {
    // clear the canvas before rendering
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // run all tasks
    for (const task of this.tasks) {
      task();
    }

    // prepare for next frame
    window.requestAnimationFrame(this.render);
  }

  public play() {
    this.render();
  }
}
