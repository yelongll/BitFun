// Color Tools - Professional Color Picker
(function() {
  var currentColor = { h: 0, s: 100, v: 100, a: 1 };
  var history = [];
  var maxHistory = 20;

  var PRESET_COLORS = {
    material: [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ],
    tailwind: [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
      '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c', '#71717a'
    ],
    css: [
      '#000000', '#808080', '#c0c0c0', '#ffffff', '#ff0000', '#800000',
      '#ffff00', '#808000', '#00ff00', '#008000', '#00ffff', '#008080',
      '#0000ff', '#000080', '#ff00ff', '#800080', '#ffa500', '#a52a2a'
    ],
    flat: [
      '#1abc9c', '#16a085', '#2ecc71', '#27ae60', '#3498db', '#2980b9',
      '#9b59b6', '#8e44ad', '#34495e', '#2c3e50', '#f1c40f', '#f39c12',
      '#e67e22', '#d35400', '#e74c3c', '#c0392b', '#ecf0f1', '#bdc3c7', '#95a5a6'
    ]
  };

  function hsvToRgb(h, s, v) {
    var r, g, b;
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;
    var d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s, v: v };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToCmyk(r, g, b) {
    if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
    var c = 1 - (r / 255);
    var m = 1 - (g / 255);
    var y = 1 - (b / 255);
    var k = Math.min(c, Math.min(m, y));
    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  function cmykToRgb(c, m, y, k) {
    c /= 100; m /= 100; y /= 100; k /= 100;
    return {
      r: Math.round(255 * (1 - c) * (1 - k)),
      g: Math.round(255 * (1 - m) * (1 - k)),
      b: Math.round(255 * (1 - y) * (1 - k))
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(x) {
      var hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function getLuminance(r, g, b) {
    var a = [r, g, b].map(function(v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrastRatio(rgb1, rgb2) {
    var l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    var l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function generatePalette(h, s, v, type) {
    var colors = [];
    var h1 = h / 360;
    switch (type) {
      case 'complementary':
        colors.push({ h: h, s: s, v: v });
        colors.push({ h: (h + 180) % 360, s: s, v: v });
        break;
      case 'analogous':
        for (var i = -1; i <= 1; i++) {
          colors.push({ h: (h + i * 30 + 360) % 360, s: s, v: v });
        }
        break;
      case 'triadic':
        for (var i = 0; i < 3; i++) {
          colors.push({ h: (h + i * 120) % 360, s: s, v: v });
        }
        break;
      case 'split-complementary':
        colors.push({ h: h, s: s, v: v });
        colors.push({ h: (h + 150) % 360, s: s, v: v });
        colors.push({ h: (h + 210) % 360, s: s, v: v });
        break;
      case 'tetradic':
        for (var i = 0; i < 4; i++) {
          colors.push({ h: (h + i * 90) % 360, s: s, v: v });
        }
        break;
      case 'monochromatic':
        for (var i = 0; i < 5; i++) {
          colors.push({ h: h, s: s, v: v * (1 - i * 0.15) });
        }
        break;
    }
    return colors;
  }

  function initSBCanvas() {
    var canvas = document.getElementById('sbCanvas');
    var ctx = canvas.getContext('2d');
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    updateSBCanvas();
  }

  function updateSBCanvas() {
    var canvas = document.getElementById('sbCanvas');
    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;
    
    var rgb = hsvToRgb(currentColor.h / 360, 1, 1);
    var baseColor = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
    
    var whiteGradient = ctx.createLinearGradient(0, 0, width, 0);
    whiteGradient.addColorStop(0, '#fff');
    whiteGradient.addColorStop(1, baseColor);
    ctx.fillStyle = whiteGradient;
    ctx.fillRect(0, 0, width, height);
    
    var blackGradient = ctx.createLinearGradient(0, 0, 0, height);
    blackGradient.addColorStop(0, 'rgba(0,0,0,0)');
    blackGradient.addColorStop(1, '#000');
    ctx.fillStyle = blackGradient;
    ctx.fillRect(0, 0, width, height);
  }

  function initHueCanvas() {
    var canvas = document.getElementById('hueCanvas');
    var ctx = canvas.getContext('2d');
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (var i = 0; i <= 6; i++) {
      gradient.addColorStop(i / 6, 'hsl(' + (i * 60) + ', 100%, 50%)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function initAlphaCanvas() {
    updateAlphaCanvas();
  }

  function updateAlphaCanvas() {
    var canvas = document.getElementById('alphaCanvas');
    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;
    
    var rgb = hsvToRgb(currentColor.h / 360, currentColor.s, currentColor.v);
    
    ctx.clearRect(0, 0, width, height);
    
    var gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
    gradient.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function updateUI() {
    var rgb = hsvToRgb(currentColor.h / 360, currentColor.s, currentColor.v);
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    var cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    
    document.getElementById('hexInput').value = hex.toUpperCase();
    document.getElementById('rInput').value = rgb.r;
    document.getElementById('gInput').value = rgb.g;
    document.getElementById('bInput').value = rgb.b;
    document.getElementById('hInput').value = Math.round(hsl.h);
    document.getElementById('sInput').value = Math.round(hsl.s);
    document.getElementById('lInput').value = Math.round(hsl.l);
    document.getElementById('hvInput').value = Math.round(currentColor.h);
    document.getElementById('svInput').value = Math.round(currentColor.s * 100);
    document.getElementById('vInput').value = Math.round(currentColor.v * 100);
    document.getElementById('cInput').value = cmyk.c;
    document.getElementById('mInput').value = cmyk.m;
    document.getElementById('yInput').value = cmyk.y;
    document.getElementById('kInput').value = cmyk.k;
    
    var preview = document.getElementById('colorPreview');
    preview.innerHTML = '<div style="background:' + hex + '"></div>';
    document.getElementById('newColor').style.background = hex;
    
    document.getElementById('cssHex').textContent = 'color: ' + hex + ';';
    document.getElementById('cssRgb').textContent = 'color: rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ');';
    document.getElementById('cssHsl').textContent = 'color: hsl(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s) + '%, ' + Math.round(hsl.l) + '%);';
    document.getElementById('formatRgba').textContent = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + currentColor.a + ')';
    document.getElementById('formatHsla').textContent = 'hsla(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s) + '%, ' + Math.round(hsl.l) + '%, ' + currentColor.a + ')';
    
    updateSBPicker();
    updateHuePicker();
    updateAlphaPicker();
    updatePalette();
    updateContrast();
  }

  function updateSBPicker() {
    var picker = document.getElementById('sbPicker');
    var canvas = document.getElementById('sbCanvas');
    var x = currentColor.s * canvas.width;
    var y = (1 - currentColor.v) * canvas.height;
    picker.style.left = x + 'px';
    picker.style.top = y + 'px';
  }

  function updateHuePicker() {
    var picker = document.getElementById('huePicker');
    var canvas = document.getElementById('hueCanvas');
    var x = (currentColor.h / 360) * canvas.width;
    picker.style.left = x + 'px';
  }

  function updateAlphaPicker() {
    var picker = document.getElementById('alphaPicker');
    var canvas = document.getElementById('alphaCanvas');
    var x = currentColor.a * canvas.width;
    picker.style.left = x + 'px';
  }

  function updatePalette() {
    var container = document.getElementById('paletteColors');
    var activeBtn = document.querySelector('.palette-btn.active');
    var type = activeBtn ? activeBtn.dataset.type : 'complementary';
    var colors = generatePalette(currentColor.h, currentColor.s, currentColor.v, type);
    
    container.innerHTML = '';
    colors.forEach(function(c) {
      var rgb = hsvToRgb(c.h / 360, c.s, c.v);
      var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      var div = document.createElement('div');
      div.className = 'palette-color';
      div.style.background = hex;
      div.setAttribute('data-hex', hex.toUpperCase());
      div.addEventListener('click', function() {
        setColorFromHex(hex);
      });
      container.appendChild(div);
    });
  }

  function updateContrast() {
    var bgHex = document.getElementById('contrastBgHex').value;
    var bgRgb = hexToRgb(bgHex);
    if (!bgRgb) return;
    
    var rgb = hsvToRgb(currentColor.h / 360, currentColor.s, currentColor.v);
    var ratio = getContrastRatio(rgb, bgRgb);
    
    document.getElementById('contrastRatio').textContent = ratio.toFixed(2) + ':1';
    
    var sample = document.getElementById('contrastSample');
    sample.style.background = bgHex;
    sample.style.color = rgbToHex(rgb.r, rgb.g, rgb.b);
    
    var aaBadge = document.getElementById('wcagAA');
    var aaaBadge = document.getElementById('wcagAAA');
    
    if (ratio >= 4.5) {
      aaBadge.textContent = '通过';
      aaBadge.className = 'badge pass';
    } else {
      aaBadge.textContent = '失败';
      aaBadge.className = 'badge fail';
    }
    
    if (ratio >= 7) {
      aaaBadge.textContent = '通过';
      aaaBadge.className = 'badge pass';
    } else {
      aaaBadge.textContent = '失败';
      aaaBadge.className = 'badge fail';
    }
  }

  function setColorFromHex(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return;
    var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    currentColor.h = hsv.h;
    currentColor.s = hsv.s;
    currentColor.v = hsv.v;
    updateSBCanvas();
    updateAlphaCanvas();
    updateUI();
    addToHistory(hex);
  }

  function setColorFromRgb(r, g, b) {
    var hsv = rgbToHsv(r, g, b);
    currentColor.h = hsv.h;
    currentColor.s = hsv.s;
    currentColor.v = hsv.v;
    updateSBCanvas();
    updateAlphaCanvas();
    updateUI();
    var hex = rgbToHex(r, g, b);
    addToHistory(hex);
  }

  function addToHistory(hex) {
    var index = history.indexOf(hex);
    if (index > -1) history.splice(index, 1);
    history.unshift(hex);
    if (history.length > maxHistory) history.pop();
    updateHistoryUI();
    saveHistory();
  }

  function updateHistoryUI() {
    var container = document.getElementById('historyColors');
    container.innerHTML = '';
    history.forEach(function(hex) {
      var div = document.createElement('div');
      div.className = 'history-color';
      div.style.background = hex;
      div.addEventListener('click', function() {
        setColorFromHex(hex);
      });
      container.appendChild(div);
    });
  }

  function saveHistory() {
    if (window.app && window.app.storage) {
      window.app.storage.set('colorHistory', history).catch(function() {});
    }
  }

  async function loadHistory() {
    if (window.app && window.app.storage) {
      try {
        var saved = await window.app.storage.get('colorHistory');
        if (Array.isArray(saved)) {
          history = saved;
          updateHistoryUI();
        }
      } catch (e) {}
    }
  }

  function loadPresets(category) {
    var container = document.getElementById('presetColors');
    var colors = PRESET_COLORS[category] || PRESET_COLORS.material;
    container.innerHTML = '';
    colors.forEach(function(hex) {
      var div = document.createElement('div');
      div.className = 'preset-color';
      div.style.background = hex;
      div.addEventListener('click', function() {
        setColorFromHex(hex);
      });
      container.appendChild(div);
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
      showCopyFeedback();
    }).catch(function() {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showCopyFeedback();
    });
  }

  function showCopyFeedback() {
    var btns = document.querySelectorAll('.copy-btn');
    btns.forEach(function(btn) {
      btn.textContent = '✓';
      setTimeout(function() {
        btn.textContent = '📋';
      }, 1000);
    });
  }

  function initEventListeners() {
    var sbCanvas = document.getElementById('sbCanvas');
    var isDraggingSB = false;
    
    function handleSBMove(e) {
      var rect = sbCanvas.getBoundingClientRect();
      var x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      var y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      currentColor.s = x / rect.width;
      currentColor.v = 1 - y / rect.height;
      updateUI();
    }
    
    sbCanvas.addEventListener('mousedown', function(e) {
      isDraggingSB = true;
      handleSBMove(e);
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isDraggingSB) handleSBMove(e);
    });
    
    document.addEventListener('mouseup', function() {
      if (isDraggingSB) {
        isDraggingSB = false;
        var rgb = hsvToRgb(currentColor.h / 360, currentColor.s, currentColor.v);
        addToHistory(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
    });
    
    var hueCanvas = document.getElementById('hueCanvas');
    var isDraggingHue = false;
    
    function handleHueMove(e) {
      var rect = hueCanvas.getBoundingClientRect();
      var x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      currentColor.h = (x / rect.width) * 360;
      updateSBCanvas();
      updateAlphaCanvas();
      updateUI();
    }
    
    hueCanvas.addEventListener('mousedown', function(e) {
      isDraggingHue = true;
      handleHueMove(e);
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isDraggingHue) handleHueMove(e);
    });
    
    document.addEventListener('mouseup', function() {
      if (isDraggingHue) {
        isDraggingHue = false;
        var rgb = hsvToRgb(currentColor.h / 360, currentColor.s, currentColor.v);
        addToHistory(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
    });
    
    var alphaCanvas = document.getElementById('alphaCanvas');
    var isDraggingAlpha = false;
    
    function handleAlphaMove(e) {
      var rect = alphaCanvas.getBoundingClientRect();
      var x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      currentColor.a = x / rect.width;
      updateUI();
    }
    
    alphaCanvas.addEventListener('mousedown', function(e) {
      isDraggingAlpha = true;
      handleAlphaMove(e);
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isDraggingAlpha) handleAlphaMove(e);
    });
    
    document.addEventListener('mouseup', function() {
      isDraggingAlpha = false;
    });
    
    document.getElementById('hexInput').addEventListener('change', function(e) {
      var hex = e.target.value;
      if (hex.match(/^#?[0-9a-fA-F]{6}$/)) {
        setColorFromHex(hex.charAt(0) === '#' ? hex : '#' + hex);
      }
    });
    
    ['rInput', 'gInput', 'bInput'].forEach(function(id) {
      document.getElementById(id).addEventListener('change', function() {
        var r = parseInt(document.getElementById('rInput').value) || 0;
        var g = parseInt(document.getElementById('gInput').value) || 0;
        var b = parseInt(document.getElementById('bInput').value) || 0;
        setColorFromRgb(
          Math.max(0, Math.min(255, r)),
          Math.max(0, Math.min(255, g)),
          Math.max(0, Math.min(255, b))
        );
      });
    });
    
    ['hInput', 'sInput', 'lInput'].forEach(function(id) {
      document.getElementById(id).addEventListener('change', function() {
        var h = parseInt(document.getElementById('hInput').value) || 0;
        var s = parseInt(document.getElementById('sInput').value) || 0;
        var l = parseInt(document.getElementById('lInput').value) || 0;
        var rgb = hslToRgb(h, s, l);
        setColorFromRgb(rgb.r, rgb.g, rgb.b);
      });
    });
    
    ['hvInput', 'svInput', 'vInput'].forEach(function(id) {
      document.getElementById(id).addEventListener('change', function() {
        currentColor.h = parseInt(document.getElementById('hvInput').value) || 0;
        currentColor.s = (parseInt(document.getElementById('svInput').value) || 0) / 100;
        currentColor.v = (parseInt(document.getElementById('vInput').value) || 0) / 100;
        updateSBCanvas();
        updateAlphaCanvas();
        updateUI();
      });
    });
    
    document.querySelectorAll('.palette-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.palette-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        updatePalette();
      });
    });
    
    document.querySelectorAll('.preset-cat-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.preset-cat-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        loadPresets(btn.dataset.category);
      });
    });
    
    document.querySelectorAll('.copy-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var targetId = btn.dataset.target;
        var target = document.getElementById(targetId);
        if (target) {
          copyToClipboard(target.textContent || target.value);
        }
      });
    });
    
    document.getElementById('contrastBgColor').addEventListener('input', function(e) {
      document.getElementById('contrastBgHex').value = e.target.value;
      updateContrast();
    });
    
    document.getElementById('contrastBgHex').addEventListener('change', function(e) {
      var hex = e.target.value;
      if (hex.match(/^#?[0-9a-fA-F]{6}$/)) {
        hex = hex.charAt(0) === '#' ? hex : '#' + hex;
        document.getElementById('contrastBgColor').value = hex;
        updateContrast();
      }
    });
    
    document.getElementById('clearHistory').addEventListener('click', function() {
      history = [];
      updateHistoryUI();
      saveHistory();
    });
    
    window.addEventListener('resize', function() {
      initSBCanvas();
      initHueCanvas();
      initAlphaCanvas();
    });
  }

  async function init() {
    initSBCanvas();
    initHueCanvas();
    initAlphaCanvas();
    initEventListeners();
    loadPresets('material');
    await loadHistory();
    updateUI();
  }

  init();
})();
