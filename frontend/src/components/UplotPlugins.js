function wheelZoomPlugin(opts) {
  let factor = opts.factor || 0.75;

  let xMin, xMax, yMin, yMax, xRange, yRange;

  function clamp(nRange, nMin, nMax, fRange, fMin, fMax) {
    if (nRange > fRange) {
      nMin = fMin;
      nMax = fMax;
    } else if (nMin < fMin) {
      nMin = fMin;
      nMax = fMin + nRange;
    } else if (nMax > fMax) {
      nMax = fMax;
      nMin = fMax - nRange;
    }

    return [nMin, nMax];
  }

  return {
    hooks: {
      ready: u => {
        xMin = u.scales.x.min;
        xMax = u.scales.x.max;
        yMin = u.scales.y.min;
        yMax = u.scales.y.max;

        xRange = xMax - xMin;
        yRange = yMax - yMin;

        let over = u.over;
        let rect = over.getBoundingClientRect();

        // wheel drag pan
        over.addEventListener('mousedown', e => {
          if (e.button === 1) {
            //	plot.style.cursor = "move";
            e.preventDefault();

            let left0 = e.clientX;
            //	let top0 = e.clientY;

            let scXMin0 = u.scales.x.min;
            let scXMax0 = u.scales.x.max;

            let xUnitsPerPx = u.posToVal(1, 'x') - u.posToVal(0, 'x');

            function onmove(e) {
              e.preventDefault();

              let left1 = e.clientX;
              //	let top1 = e.clientY;

              let dx = xUnitsPerPx * (left1 - left0);

              u.setScale('x', {
                min: scXMin0 - dx,
                max: scXMax0 - dx
              });
            }

            function onup(e) {
              document.removeEventListener('mousemove', onmove);
              document.removeEventListener('mouseup', onup);
            }

            document.addEventListener('mousemove', onmove);
            document.addEventListener('mouseup', onup);
          }
        });

        // wheel scroll zoom
        over.addEventListener('wheel', e => {
          e.preventDefault();

          let { left, top } = u.cursor;

          let leftPct = left / rect.width;
          let btmPct = 1 - top / rect.height;
          let xVal = u.posToVal(left, 'x');
          let yVal = u.posToVal(top, 'y');
          let oxRange = u.scales.x.max - u.scales.x.min;
          let oyRange = u.scales.y.max - u.scales.y.min;

          let nxRange = e.deltaY < 0 ? oxRange * factor : oxRange / factor;
          let nxMin = xVal - leftPct * nxRange;
          let nxMax = nxMin + nxRange;
          [nxMin, nxMax] = clamp(nxRange, nxMin, nxMax, xRange, xMin, xMax);

          let nyRange = e.deltaY < 0 ? oyRange * factor : oyRange / factor;
          let nyMin = yVal - btmPct * nyRange;
          let nyMax = nyMin + nyRange;
          [nyMin, nyMax] = clamp(nyRange, nyMin, nyMax, yRange, yMin, yMax);

          u.batch(() => {
            u.setScale('x', {
              min: nxMin,
              max: nxMax
            });

            u.setScale('y', {
              min: nyMin,
              max: nyMax
            });
          });
        });
      }
    }
  };
}

function touchZoomPlugin(opts) {
  function init(u, opts, data) {
    let over = u.over;
    let rect, oxRange, oyRange, xVal, yVal;
    let fr = { x: 0, y: 0, dx: 0, dy: 0 };
    let to = { x: 0, y: 0, dx: 0, dy: 0 };

    function storePos(t, e) {
      let ts = e.touches;

      let t0 = ts[0];
      let t0x = t0.clientX - rect.left;
      let t0y = t0.clientY - rect.top;

      if (ts.length === 1) {
        t.x = t0x;
        t.y = t0y;
        t.d = t.dx = t.dy = 1;
      } else {
        let t1 = e.touches[1];
        let t1x = t1.clientX - rect.left;
        let t1y = t1.clientY - rect.top;

        let xMin = Math.min(t0x, t1x);
        let yMin = Math.min(t0y, t1y);
        let xMax = Math.max(t0x, t1x);
        let yMax = Math.max(t0y, t1y);

        // midpts
        t.y = (yMin + yMax) / 2;
        t.x = (xMin + xMax) / 2;

        t.dx = xMax - xMin;
        t.dy = yMax - yMin;

        // dist
        t.d = Math.sqrt(t.dx * t.dx + t.dy * t.dy);
      }
    }

    let rafPending = false;

    function zoom() {
      rafPending = false;

      let left = to.x;
      let top = to.y;

      // non-uniform scaling
      //	let xFactor = fr.dx / to.dx;
      //	let yFactor = fr.dy / to.dy;

      // uniform x/y scaling
      let xFactor = fr.d / to.d;
      let yFactor = fr.d / to.d;

      let leftPct = left / rect.width;
      let btmPct = 1 - top / rect.height;

      let nxRange = oxRange * xFactor;
      let nxMin = xVal - leftPct * nxRange;
      let nxMax = nxMin + nxRange;

      let nyRange = oyRange * yFactor;
      let nyMin = yVal - btmPct * nyRange;
      let nyMax = nyMin + nyRange;

      u.batch(() => {
        u.setScale('x', {
          min: nxMin,
          max: nxMax
        });

        u.setScale('y', {
          min: nyMin,
          max: nyMax
        });
      });
    }

    function touchmove(e) {
      storePos(to, e);

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(zoom);
      }
    }

    over.addEventListener('touchstart', function (e) {
      rect = over.getBoundingClientRect();

      storePos(fr, e);

      oxRange = u.scales.x.max - u.scales.x.min;
      oyRange = u.scales.y.max - u.scales.y.min;

      let left = fr.x;
      let top = fr.y;

      xVal = u.posToVal(left, 'x');
      yVal = u.posToVal(top, 'y');

      document.addEventListener('touchmove', touchmove, { passive: true });
    });

    over.addEventListener('touchend', function (e) {
      document.removeEventListener('touchmove', touchmove, { passive: true });
    });
  }

  return {
    hooks: {
      init
    }
  };
}

function tooltipsPlugin(opts) {
  function init(u, opts, data) {
    let over = u.over

    let ttc = u.cursortt = document.createElement("div")
    ttc.className = "tooltip"
    over.appendChild(ttc)

    function hideTips() {
      ttc.style.display = "none"
    }

    function showTips() {
      ttc.style.display = null
    }

    over.addEventListener("mouseleave", () => {
      if (!u.cursor._lock) {
        hideTips()
      }
    })

    over.addEventListener("mouseenter", () => {
      showTips()
    })

    hideTips()
  }

  function setCursor(u) {
    // console.log(u, opts)
    let {left, top, idx} = u.cursor
    if (u.data.length < 2) {
      return
    }
    const x = opts?.xLabels ? opts.xLabels[idx] : u.data[0][idx]
    const y = u.data[1][idx]

    if (x) {
      u.cursortt.innerHTML = `<span class="x-value">${u.scales.x.time ? new Date(x*1000).toISOString().split('T')[0] : x}</span>&nbsp;&nbsp;${y.toLocaleString()}`
    }
    const cursorX = u.over.getBoundingClientRect().x + left
    const cursorY = u.over.getBoundingClientRect().y + top
    if (cursorX + u.cursortt.offsetWidth > document.documentElement.clientWidth - 16) {
      left -= u.cursortt.offsetWidth
    }
    if (cursorY + u.cursortt.offsetHeight > document.documentElement.clientHeight - 16) {
      top -= u.cursortt.offsetHeight
    }
    u.cursortt.style.left = left + "px"
    u.cursortt.style.top = top + "px"
  }

  return {
    hooks: {
      init,
      setCursor,
    },
  }
}

export { wheelZoomPlugin, touchZoomPlugin, tooltipsPlugin };
