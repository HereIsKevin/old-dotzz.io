export { Config, defaultConfig };

interface Config {
  host: string;
  port: number;
  width: number;
  height: number;
  velocityIncrease: number;
  velocityDecrease: number;
  maxVelocity: number;
  frameRate: number;
  responseRate: number;
  tolerance: number;
  resolve: number;
}

const defaultConfig: Config = {
  host: "192.168.1.196",
  port: 8000,
  width: 1000,
  height: 1000,
  velocityIncrease: 0.4,
  velocityDecrease: 0.1,
  maxVelocity: 4,
  frameRate: 1000 / 60,
  responseRate: 1000 / 6,
  tolerance: 1,
  resolve: 2,
};
