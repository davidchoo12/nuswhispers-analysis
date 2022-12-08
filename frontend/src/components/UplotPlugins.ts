import uPlot from 'uplot'

// adapted from https://leeoniya.github.io/uPlot/demos/tooltips.html
function tooltipsPlugin(opts?: { xLabels: (string | number)[] }): uPlot.Plugin {
  let ttc: HTMLDivElement
  function init(u: uPlot, opts: uPlot.Options, data: uPlot.AlignedData) {
    let over = u.over

    ttc = document.createElement('div')
    ttc.className = 'tooltip'
    over.appendChild(ttc)

    function hideTips() {
      ttc.style.display = 'none'
    }

    function showTips() {
      ttc.style.display = 'block'
    }

    over.addEventListener(
      'mouseleave',
      () => {
        if (!u.cursor.lock) {
          hideTips()
        }
      },
      { passive: true }
    )

    over.addEventListener(
      'mouseenter',
      () => {
        showTips()
      },
      { passive: true }
    )

    hideTips()
  }

  function setCursor(u: uPlot) {
    let { left = 0, top = 0, idx = 0 } = u.cursor
    if (idx == null) {
      idx = 0
    }
    if (u.data.length < 2) {
      return
    }
    const x = opts?.xLabels ? opts.xLabels[idx] : u.data[0][idx]
    const y = u.data[1][idx] || 0

    ttc.innerHTML = `<span class="x-value">${
      u.scales.x.time && typeof x === 'number' ? new Date(x * 1000).toISOString().split('T')[0] : x
    }</span><span class="y-value">${y.toLocaleString()}</span>`
    if (left + ttc.offsetWidth > u.over.clientWidth - 16) {
      left -= ttc.offsetWidth
    }
    if (top + ttc.offsetHeight > u.over.clientHeight - 16) {
      top -= ttc.offsetHeight
    }

    ttc.style.left = left + 'px'
    ttc.style.top = top + 'px'
  }

  return {
    hooks: {
      init,
      setCursor,
    },
  }
}

export { tooltipsPlugin }
