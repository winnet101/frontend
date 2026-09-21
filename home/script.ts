import { SerialPort, ReadlineParser } from "serialport";

const port = new SerialPort({
  path: "/dev/ttyACM0", // Often COM3, COM4, etc. on Windows
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

parser.on("data", (line) => {
  console.log("Arduino:", line);
  ctx.strokeStyle = "line";
});

port.on("error", (error) => {
  console.error("Serial error:", error.message);
});
