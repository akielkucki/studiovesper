import { gsap } from 'gsap'
import { VERT, SIM, DROP, RENDER, MAX_DROPS } from './shaders.js'

const CELL = 4 // CSS px per simulation cell
const STEP_HZ = 90 // simulation steps per second, independent of frame rate
const MAX_DPR = 1.75
const PIXEL_BUDGET = 4.2e6 // cap on canvas pixels, so 4K screens don't pay 4K shader costs
const DAMPING = 0.992

/**
 * WebGL2 night-water surface with a liquid-metal puddle.
 * The hero component owns layout; this class only draws what it is told:
 * puddle geometry and the headline rect come in as CSS pixels relative to the canvas,
 * and everything in `state` is tweened from outside with GSAP.
 */
export class LiquidSurface {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas
    this.reduced = reducedMotion
    this.state = {
      reveal: 0,
      scale: 0,
      hover: 0,
      press: 0,
      dim: 0,
      light: 0,
      lightX: -1e4,
      lightY: -1e4,
      leanX: 0,
      leanY: 0,
    }
    // ripple slope, ambient swell, caustics, grid alpha
    this.tune = [2.4, 0.06, 3.2, 0.05]
    this.puddle = { x: 0, y: 0, rx: 1, ry: 1 }
    this.text = [0, 0, 0, 0]
    this.pointer = null
    this.queue = []
    this.time = reducedMotion ? 18 : 0
    this.acc = 0
    this.rainIn = 1.6
    this.pulseIn = 3.8
    this.quality = 1
    this.slowFrames = 0
    this.running = false
    this.cssW = 1
    this.cssH = 1
    this.dpr = 1
    this.onLost = null
    this._dropA = new Float32Array(MAX_DROPS * 4)
    this._dropB = new Float32Array(MAX_DROPS * 4)
    this._tick = this._tick.bind(this)
    this.ok = this._init()
  }

  // ---------------------------------------------------------------- setup

  _init() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    })
    if (!gl) return false
    this.gl = gl

    this.renderProg = this._program(VERT, RENDER)
    if (!this.renderProg) return false

    // Ripples need a float render target; without one the surface still breathes and reflects.
    const floatTargets = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')
    if (floatTargets && !this.reduced) {
      this.simProg = this._program(VERT, SIM)
      this.dropProg = this._program(VERT, DROP)
    }

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    this.vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    this.blank = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.blank)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))

    this._onLost = (event) => {
      event.preventDefault()
      this.stop()
      this.ok = false
      this.onLost?.()
    }
    this.canvas.addEventListener('webglcontextlost', this._onLost)

    this.resize()
    return true
  }

  _program(vsSource, fsSource) {
    const gl = this.gl
    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('[liquid] shader compile failed:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }
    const vs = compile(gl.VERTEX_SHADER, vsSource)
    const fs = compile(gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return null

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[liquid] program link failed:', gl.getProgramInfoLog(program))
      return null
    }

    const u = {}
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < count; i++) {
      const { name } = gl.getActiveUniform(program, i)
      u[name.replace(/\[0\]$/, '')] = gl.getUniformLocation(program, name)
    }
    return { program, u }
  }

  _target(w, h) {
    const gl = this.gl
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
    if (complete) {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    if (complete) return { tex, fb }
    gl.deleteFramebuffer(fb)
    gl.deleteTexture(tex)
    return null
  }

  _createSim(w, h) {
    const a = this._target(w, h)
    const b = a && this._target(w, h)
    if (!a || !b) {
      if (a) this._deleteTarget(a)
      this.simProg = this.dropProg = null
      return null
    }
    return {
      w,
      h,
      read: a,
      write: b,
      swap() {
        const read = this.read
        this.read = this.write
        this.write = read
      },
    }
  }

  _deleteTarget({ tex, fb }) {
    this.gl.deleteFramebuffer(fb)
    this.gl.deleteTexture(tex)
  }

  _destroySim() {
    if (!this.sim) return
    this._deleteTarget(this.sim.read)
    this._deleteTarget(this.sim.write)
    this.sim = null
  }

  // ---------------------------------------------------------------- layout

  resize() {
    if (!this.gl) return
    const rect = this.canvas.getBoundingClientRect()
    this.cssW = Math.max(1, rect.width)
    this.cssH = Math.max(1, rect.height)
    let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) * this.quality
    dpr = Math.min(dpr, Math.sqrt(PIXEL_BUDGET / (this.cssW * this.cssH)))
    const w = Math.max(1, Math.round(this.cssW * dpr))
    const h = Math.max(1, Math.round(this.cssH * dpr))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    this.dpr = w / this.cssW

    if (this.simProg && this.dropProg) {
      const sw = Math.max(16, Math.round(this.cssW / CELL))
      const sh = Math.max(16, Math.round(this.cssH / CELL))
      if (!this.sim || this.sim.w !== sw || this.sim.h !== sh) {
        this._destroySim()
        this.sim = this._createSim(sw, sh)
      }
    }
  }

  /** Puddle centre and radii in CSS px, relative to the canvas. */
  setPuddle(x, y, rx, ry) {
    Object.assign(this.puddle, { x, y, rx, ry })
  }

  /** Headline block in CSS px, relative to the canvas. Highlights stay calm inside it. */
  setTextRect(left, top, right, bottom) {
    this.text = [left, top, right, bottom]
  }

  // ---------------------------------------------------------------- input

  /** Pointer position in CSS px relative to the canvas; strokes leave a wake. */
  move(x, y) {
    if (!this.pointer) {
      this.pointer = { x, y }
      return
    }
    const dist = Math.hypot(x - this.pointer.x, y - this.pointer.y)
    if (dist < 1) return
    const k = Math.min(dist / 36, 1)
    this._queue(0, this.pointer.x, this.pointer.y, x, y, 10 + 10 * k, -(0.06 + 0.22 * k))
    this.pointer.x = x
    this.pointer.y = y
  }

  leave() {
    this.pointer = null
  }

  drop(x, y, radius, strength) {
    this._queue(0, x, y, x, y, radius, strength)
  }

  /** A ring pushed out from the puddle's rim. */
  ring(strength = 0.3, spread = 1) {
    const { x, y, rx, ry } = this.puddle
    const s = this.state.scale * spread
    this._queue(1, x, y, rx * s, ry * s, 14, strength)
  }

  splash(strength = 1.1) {
    const { x, y, rx, ry } = this.puddle
    this.drop(x, y, Math.min(rx, ry) * 0.45, strength)
  }

  _queue(mode, ax, ay, bx, by, radius, strength) {
    if (!this.sim || this.queue.length >= 32) return
    this.queue.push([mode, ax, ay, bx, by, radius, strength])
  }

  _insidePuddle(x, y, margin) {
    const { x: cx, y: cy, rx, ry } = this.puddle
    return ((x - cx) / (rx * margin)) ** 2 + ((y - cy) / (ry * margin)) ** 2 < 1
  }

  _insideText(x, y, margin) {
    const [l, t, r, b] = this.text
    return x > l - margin && x < r + margin && y > t - margin && y < b + margin
  }

  // ---------------------------------------------------------------- loop

  start() {
    if (!this.ok || this.running || this.reduced) return
    this.running = true
    gsap.ticker.add(this._tick)
  }

  stop() {
    if (!this.running) return
    this.running = false
    gsap.ticker.remove(this._tick)
  }

  renderOnce() {
    if (this.ok) this._draw()
  }

  _tick(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05)
    this.time += dt
    this._watchPerformance(dt)

    if (this.sim) {
      this._ambient(dt)
      if (this.queue.length) this._flush()
      this.acc += dt
      const steps = Math.floor(this.acc * STEP_HZ)
      this.acc -= steps / STEP_HZ
      for (let i = 0; i < Math.min(steps, 4); i++) this._step()
    }
    this._draw()
  }

  /** Occasional raindrops away from the headline, and a slow pulse from the puddle. */
  _ambient(dt) {
    this.rainIn -= dt
    if (this.rainIn <= 0) {
      this.rainIn = 0.7 + Math.random() * 1.4
      const x = this.cssW * (0.3 + Math.random() * 0.7)
      const y = this.cssH * Math.random()
      if (!this._insidePuddle(x, y, 1.2) && !this._insideText(x, y, 60)) {
        const sign = Math.random() < 0.5 ? -1 : 1
        this.drop(x, y, 6 + Math.random() * 8, sign * (0.08 + Math.random() * 0.1))
      }
    }
    this.pulseIn -= dt
    if (this.pulseIn <= 0) {
      this.pulseIn = 4.4 + Math.random() * 1.8
      if (this.state.scale > 0.9 && this.state.hover < 0.5) this.ring(0.14)
    }
  }

  /** Drops resolution when the device can't keep up, then stays there. */
  _watchPerformance(dt) {
    if (this.quality <= 0.56) return
    this.slowFrames = dt > 1 / 40 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 2)
    if (this.slowFrames > 50) {
      this.slowFrames = 0
      this.quality = Math.max(0.55, this.quality * 0.8)
      this.resize()
    }
  }

  _pass(prog, setUniforms) {
    const gl = this.gl
    const sim = this.sim
    gl.bindFramebuffer(gl.FRAMEBUFFER, sim.write.fb)
    gl.viewport(0, 0, sim.w, sim.h)
    gl.useProgram(prog.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, sim.read.tex)
    gl.uniform1i(prog.u.uState, 0)
    setUniforms(prog.u)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    sim.swap()
  }

  _flush() {
    const gl = this.gl
    const sim = this.sim
    const sx = sim.w / this.cssW
    const sy = sim.h / this.cssH
    const A = this._dropA
    const B = this._dropB
    while (this.queue.length) {
      const batch = this.queue.splice(0, MAX_DROPS)
      batch.forEach(([mode, ax, ay, bx, by, radius, strength], i) => {
        if (mode === 0) {
          A.set([ax * sx, (this.cssH - ay) * sy, bx * sx, (this.cssH - by) * sy], i * 4)
        } else {
          A.set([ax * sx, (this.cssH - ay) * sy, Math.max(bx * sx, 0.5), Math.max(by * sy, 0.5)], i * 4)
        }
        B.set([Math.max(radius * sx, 1), strength, mode, 0], i * 4)
      })
      this._pass(this.dropProg, (u) => {
        gl.uniform2f(u.uSize, sim.w, sim.h)
        gl.uniform1i(u.uCount, batch.length)
        gl.uniform4fv(u.uA, A)
        gl.uniform4fv(u.uB, B)
      })
    }
  }

  _step() {
    const gl = this.gl
    const sim = this.sim
    this._pass(this.simProg, (u) => {
      gl.uniform2f(u.uTexel, 1 / sim.w, 1 / sim.h)
      gl.uniform1f(u.uDamping, DAMPING)
    })
  }

  _draw() {
    const gl = this.gl
    const { u, program } = this.renderProg
    const s = this.state
    const d = this.dpr
    const h = this.cssH

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.sim ? this.sim.read.tex : this.blank)
    gl.uniform1i(u.uState, 0)
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height)
    gl.uniform1f(u.uDpr, d)
    gl.uniform2f(u.uSimTexel, this.sim ? 1 / this.sim.w : 0, this.sim ? 1 / this.sim.h : 0)
    gl.uniform1f(u.uHasSim, this.sim ? 1 : 0)
    gl.uniform1f(u.uTime, this.time)
    gl.uniform3f(u.uLight, s.lightX * d, (h - s.lightY) * d, s.light)
    gl.uniform4f(u.uPuddle, this.puddle.x * d, (h - this.puddle.y) * d, this.puddle.rx * d, this.puddle.ry * d)
    gl.uniform3f(u.uPuddleState, s.scale, s.hover, s.press)
    gl.uniform2f(u.uLean, s.leanX * d, -s.leanY * d)
    const [left, top, right, bottom] = this.text
    gl.uniform4f(u.uText, left * d, (h - bottom) * d, right * d, (h - top) * d)
    gl.uniform1f(u.uReveal, s.reveal)
    gl.uniform1f(u.uDim, s.dim)
    gl.uniform1f(u.uGrid, (this.cssW < 700 ? 44 : 64) * d)
    gl.uniform4fv(u.uTune, this.tune)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy() {
    this.stop()
    this.canvas.removeEventListener('webglcontextlost', this._onLost)
    if (!this.gl) return
    this._destroySim()
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
    this.gl = null
    this.ok = false
  }
}
