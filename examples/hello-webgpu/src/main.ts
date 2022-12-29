async function initWebGPU() {
  const container = document.querySelector('.container')!
  try {
    if (!navigator.gpu) {
      throw new Error('你的浏览器不支持WebGPU')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('没有找到 WebGPU 适配器')
    }

    let key: keyof GPUSupportedLimits
    for (key in adapter.limits) {
      container.innerHTML += `<p style="margin: 0">${key}: ${adapter.limits[key]}</p>`
    }
  }
  catch (error: any) {
    container.innerHTML = `<h3>${error.message}</h3>`
  }
}
initWebGPU()
