import fs from "fs";
import path from "path";

async function loadLocalFont(
  fontPath: string
): Promise<ArrayBuffer> {
  try {
    // 读取本地字体文件
    const fontBuffer = fs.readFileSync(fontPath);
    // 使用 Uint8Array 作为中间步骤来确保类型兼容性
    const uint8Array = new Uint8Array(
      fontBuffer.buffer,
      fontBuffer.byteOffset,
      fontBuffer.byteLength
    );
    // 创建新的 ArrayBuffer 并复制数据
    const arrayBuffer = new ArrayBuffer(uint8Array.length);
    new Uint8Array(arrayBuffer).set(uint8Array);
    return arrayBuffer;
  } catch (error) {
    throw new Error(`Failed to load local font: ${fontPath}. Error: ${error}`);
  }
}

async function loadGoogleFonts(
  text: string
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const fontsConfig = [
    {
      name: "IBM Plex Sans SC",
      fontPath: "public/fonts/IBMPlexSansSC-Regular.woff",
      weight: 400,
      style: "normal",
    },
    {
      name: "IBM Plex Sans SC",
      fontPath: "public/fonts/IBMPlexSansSC-Bold.woff",
      weight: 700,
      style: "bold",
    },
  ];

  const fonts = await Promise.all(
    fontsConfig.map(async ({ name, fontPath, weight, style }) => {
      // 解析相对于项目根目录的绝对路径
      const absoluteFontPath = path.resolve(process.cwd(), fontPath);
      const data = await loadLocalFont(absoluteFontPath);
      return { name, data, weight, style };
    })
  );

  return fonts;
}

export default loadGoogleFonts;
