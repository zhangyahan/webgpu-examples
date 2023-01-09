import vert from './shaders/basic.triangle.vert.wgsl?raw'
import frag from './shaders/basic.triangle.frag.wgsl?raw'

interface WindowSize {
  height: number
  width: number
}

/**
 * 初始化 WebGPU 设备以及对 canvas 进行配置
 */
export async function initWebGPU(canvas: HTMLCanvasElement): Promise<{
  device: GPUDevice
  context: GPUCanvasContext
  format: GPUTextureFormat
  size: WindowSize
}> {
  if (!navigator.gpu) {
    throw new Error('您的浏览器不支持 WebGPU')
  }
  // 请求显卡适配器
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance',
  })

  if (!adapter) {
    throw new Error('您的浏览器无法获取到 WebGPU 适配器')
  }

  const device = await adapter.requestDevice()
  const context = canvas.getContext('webgpu') as GPUCanvasContext
  const format = navigator.gpu.getPreferredCanvasFormat()
  const devicePixelRatio = window.devicePixelRatio || 1
  canvas.width = canvas.width * devicePixelRatio
  canvas.height = canvas.height * devicePixelRatio
  const size: WindowSize = { width: canvas.width, height: canvas.height }
  context.configure({
    device,
    format,
    alphaMode: 'opaque',
  })

  return { device, context, format, size }
}

/**
 * 创建一个简单的渲染管道
 */
export async function initPipeline(device: GPUDevice, format: GPUTextureFormat): Promise<GPURenderPipeline> {
  return await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: vert,
      }),
      entryPoint: 'main',
    },
    primitive: {
      topology: 'triangle-list',
    },
    fragment: {
      module: device.createShaderModule({
        code: frag,
      }),
      entryPoint: 'main',
      targets: [{
        format,
      }],
    },
  })
}

/**
 * 创建并提交命令
 */
export function draw(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline, MSAAView: GPUTextureView) {
  const commandEncoder = device.createCommandEncoder()
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: MSAAView,
        resolveTarget: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  })
  passEncoder.setPipeline(pipeline)
  passEncoder.draw(3)
  passEncoder.end()

  device.queue.submit([commandEncoder.finish()])
}

export async function main() {
  const canvas = document.querySelector('canvas')
  if (!canvas) {
    throw new Error('为找到 Canvas 元素')
  }

  const { device, context, format, size } = await initWebGPU(canvas)
  const pipeline = await initPipeline(device, format)

  let msaaTexture = device.createTexture({
    size,
    format,
    sampleCount: 4,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  })
  let msaa = msaaTexture.createView()

  draw(device, context, pipeline, msaa)

  window.addEventListener('resize', () => {
    size.width = canvas.width = canvas.clientWidth * window.devicePixelRatio
    size.height = canvas.height = canvas.clientHeight * window.devicePixelRatio

    msaaTexture.destroy()
    msaaTexture = device.createTexture({
      size,
      format,
      sampleCount: 4,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
    msaa = msaaTexture.createView()

    draw(device, context, pipeline, msaa)
  })
}

main()
