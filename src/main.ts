import "./style.css";

interface SerialPortReader {
  read(): Promise<{ value?: Uint8Array; done: boolean }>;
  releaseLock(): void;
}

interface SerialPortConnection {
  readable: ReadableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface SerialPortApi {
  requestPort(): Promise<SerialPortConnection>;
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found");
}

app.innerHTML = `
  <header class="topbar">
    <div>
      <p class="eyebrow">Arduino canvas</p>
      <h1>Color sketch</h1>
    </div>
    <button class="connect-button" type="button">Connect Arduino</button>
  </header>
  <main>
    <section class="intro">
      <div>
        <p class="eyebrow">Draw with your hardware</p>
        <h2>Make something colorful.</h2>
        <p class="description">Connect your Arduino and draw on the canvas. Every color received from the serial port becomes your brush color.</p>
      </div>
      <div class="status-card">
        <span class="status-dot" aria-hidden="true"></span>
        <div>
          <span class="status-label">Current color</span>
          <strong class="color-name">#111827</strong>
        </div>
        <span class="color-swatch" aria-hidden="true"></span>
      </div>
    </section>
    <section class="canvas-wrap">
      <canvas aria-label="Drawing canvas"></canvas>
      <div class="canvas-hint">Press and drag to draw</div>
    </section>
    <p class="connection-status" role="status">Arduino is not connected</p>
  </main>
`;

const canvas = app.querySelector<HTMLCanvasElement>("canvas")!;
const connectButton = app.querySelector<HTMLButtonElement>(".connect-button")!;
const colorName = app.querySelector<HTMLElement>(".color-name")!;
const colorSwatch = app.querySelector<HTMLElement>(".color-swatch")!;
const statusDot = app.querySelector<HTMLElement>(".status-dot")!;
const connectionStatus = app.querySelector<HTMLElement>(".connection-status")!;

if (
  !canvas ||
  !connectButton ||
  !colorName ||
  !colorSwatch ||
  !statusDot ||
  !connectionStatus
) {
  throw new Error("Drawing UI could not be initialized");
}

const context = canvas.getContext("2d")!;
if (!context) {
  throw new Error("Canvas drawing is not supported");
}

const defaultColor = "#111827";
let currentColor = defaultColor;
let serialPort: SerialPortConnection | null = null;
let serialReader: SerialPortReader | null = null;
let isDrawing = false;

function resizeCanvas(): void {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
  context.scale(pixelRatio, pixelRatio);
  context.lineCap = "round";
  context.lineJoin = "round";
}

function setColor(value: string): void {
  const color = value.trim();

  if (!color || !CSS.supports("color", color)) {
    return;
  }

  currentColor = color;
  colorName.textContent = color;
  colorSwatch.style.backgroundColor = color;
}

function pointFromEvent(event: PointerEvent): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
}

function drawDot(point: { x: number; y: number }): void {
  context.fillStyle = currentColor;
  context.beginPath();
  context.arc(point.x, point.y, 7, 0, Math.PI * 2);
  context.fill();
}

canvas.addEventListener("pointerdown", (event) => {
  isDrawing = true;
  canvas.setPointerCapture(event.pointerId);
  const point = pointFromEvent(event);
  context.strokeStyle = currentColor;
  context.lineWidth = 14;
  context.beginPath();
  context.moveTo(point.x, point.y);
  drawDot(point);
});

canvas.addEventListener("pointermove", (event) => {
  if (!isDrawing) {
    return;
  }

  const point = pointFromEvent(event);
  context.lineTo(point.x, point.y);
  context.stroke();
  context.beginPath();
  context.moveTo(point.x, point.y);
});

function stopDrawing(event: PointerEvent): void {
  if (isDrawing && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  isDrawing = false;
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

function setConnectionState(connected: boolean, message: string): void {
  connectButton.textContent = connected
    ? "Disconnect Arduino"
    : "Connect Arduino";
  connectButton.classList.toggle("connected", connected);
  statusDot.classList.toggle("connected", connected);
  connectionStatus.textContent = message;
}

async function readColors(port: SerialPortConnection): Promise<void> {
  if (!port.readable) {
    throw new Error("The serial port is not readable");
  }

  const reader = port.readable.getReader() as unknown as SerialPortReader;
  serialReader = reader;
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      lines.forEach(setColor);
    }
    setColor(buffer);
  } finally {
    reader.releaseLock();
    serialReader = null;
  }
}

async function disconnect(): Promise<void> {
  serialReader?.releaseLock();
  serialReader = null;
  if (serialPort) {
    await serialPort.close();
    serialPort = null;
  }
  setConnectionState(false, "Arduino is not connected");
}

async function connect(): Promise<void> {
  const serial = (navigator as Navigator & { serial?: SerialPortApi }).serial;

  if (!serial) {
    setConnectionState(false, "Web Serial is not supported in this browser");
    return;
  }

  serialPort = await serial.requestPort();
  await serialPort.open({ baudRate: 9600 });
  setConnectionState(true, "Listening for colors from Arduino");
  void readColors(serialPort).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Serial connection failed";
    setConnectionState(false, message);
    serialPort = null;
  });
}

connectButton.addEventListener("click", () => {
  const action = serialPort ? disconnect() : connect();
  void action.catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unable to connect to Arduino";
    setConnectionState(false, message);
    serialPort = null;
  });
});

resizeCanvas();
setColor(defaultColor);
window.addEventListener("resize", resizeCanvas);
