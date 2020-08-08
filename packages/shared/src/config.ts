export { Config, defaultConfig };

interface Config {
  host: string;
  port: number;
  width: number;
  height: number;
  velocityIncrease: number;
  velocityDecrease: number;
  maxVelocity: number;
  moveInterval: number;
}

const defaultConfig: Config = {
  host: "192.168.1.196",
  port: 8000,
  width: 1000,
  height: 1000,
  velocityIncrease: 0.4,
  velocityDecrease: 0.1,
  maxVelocity: 4,
  moveInterval: 1000 / 60,
};
