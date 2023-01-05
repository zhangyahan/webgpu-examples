import vert from './shaders/basic.triangle.vert.wgsl?raw'
import frag from './shaders/basic.triangle.frag.wgsl?raw'

/**
 * 初始化 WebGPU 设备以及对 canvas 进行配置
 */
export async function initWebGPU(canvas: HTMLCanvasElement): Promise<{
  device: GPUDevice
  context: GPUCanvasContext
  format: GPUTextureFormat
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
  context.configure({
    device,
    format,
    alphaMode: 'opaque',
  })

  return { device, context, format }
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
export function draw(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline) {
  const commandEncoder = device.createCommandEncoder()
  const view = context.getCurrentTexture().createView()
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view,
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

  const { device, context, format } = await initWebGPU(canvas)
  const pipeline = await initPipeline(device, format)

  draw(device, context, pipeline)

  window.addEventListener('resize', () => {
    canvas.width = canvas.clientWidth * window.devicePixelRatio
    canvas.height = canvas.clientHeight * window.devicePixelRatio

    draw(device, context, pipeline)
  })
}

main()
