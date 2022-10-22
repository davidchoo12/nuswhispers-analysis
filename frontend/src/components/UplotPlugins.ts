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

    over.addEventListener('mouseleave', () => {
      if (!u.cursor.lock) {
        hideTips()
      }
    })

    over.addEventListener('mouseenter', () => {
      showTips()
    })

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
    const y = u.data[1][idx]

    if (typeof x === 'number' && typeof y === 'number') {
      ttc.innerHTML = `<span class="x-value">${
        u.scales.x.time ? new Date(x * 1000).toISOString().split('T')[0] : x
      }</span>&nbsp;&nbsp;${y.toLocaleString()}`
    }
    const cursorX = u.over.getBoundingClientRect().x + left
    const cursorY = u.over.getBoundingClientRect().y + top
    if (cursorX + ttc.offsetWidth > document.documentElement.clientWidth - 16) {
      left -= ttc.offsetWidth
    }
    if (cursorY + ttc.offsetHeight > document.documentElement.clientHeight - 16) {
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
