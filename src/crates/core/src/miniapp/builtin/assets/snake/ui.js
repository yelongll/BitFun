// Snake - built-in MiniApp
// Classic snake game with stunning visual effects and power-ups

(function() {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var overlay = document.getElementById('overlay');
  var overlayTitle = document.getElementById('overlayTitle');
  var overlayText = document.getElementById('overlayText');
  var scoreEl = document.getElementById('score');
  var highScoreEl = document.getElementById('highScore');
  var startBtn = document.getElementById('startBtn');
  var pauseBtn = document.getElementById('pauseBtn');

  var GRID_SIZE = 20;
  var COLS = GRID_SIZE;
  var ROWS = GRID_SIZE;
  var cellSize = 20;

  var snake = [];
  var direction = { x: 1, y: 0 };
  var nextDirection = { x: 1, y: 0 };
  var food = { x: 0, y: 0 };
  var score = 0;
  var highScore = 0;
  var gameRunning = false;
  var gamePaused = false;
  var gameLoop = null;
  var speed = 150;
  var animationFrame = null;
  var time = 0;

  var particles = [];
  var bgParticles = [];
  var trails = [];
  var foodPulse = 0;

  var powerUps = [];
  var activePowerUps = {
    speed: null,
    shield: null,
    doubleScore: null,
    magnet: null
  };
  var hasShield = false;
  var hasDoubleScore = false;
  var hasMagnet = false;
  var baseSpeed = 150;

  var POWER_UP_TYPES = {
    SPEED: { color: '#fbbf24', name: '加速', icon: '⚡', duration: 5000 },
    SHIELD: { color: '#3b82f6', name: '护盾', icon: '🛡️', duration: 8000 },
    DOUBLE_SCORE: { color: '#f59e0b', name: '双倍', icon: '⭐', duration: 10000 },
    SHRINK: { color: '#a855f7', name: '缩短', icon: '💎', duration: 0 },
    MAGNET: { color: '#06b6d4', name: '磁铁', icon: '🧲', duration: 6000 }
  };

  function initBgParticles() {
    bgParticles = [];
    for (var i = 0; i < 50; i++) {
      bgParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  function updateBgParticles() {
    for (var i = 0; i < bgParticles.length; i++) {
      var p = bgParticles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }
  }

  function drawBgParticles() {
    for (var i = 0; i < bgParticles.length; i++) {
      var p = bgParticles[i];
      ctx.fillStyle = 'rgba(74, 222, 128, ' + p.alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function createExplosion(x, y, color) {
    color = color || '#4ade80';
    for (var i = 0; i < 20; i++) {
      var angle = (Math.PI * 2 / 20) * i;
      var spd = Math.random() * 4 + 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 4 + 2,
        life: 1,
        color: color
      });
    }
  }

  function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      p.size *= 0.96;
      
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function addTrail(x, y) {
    trails.push({
      x: x,
      y: y,
      life: 1
    });
    if (trails.length > 30) {
      trails.shift();
    }
  }

  function updateTrails() {
    for (var i = trails.length - 1; i >= 0; i--) {
      trails[i].life -= 0.05;
      if (trails[i].life <= 0) {
        trails.splice(i, 1);
      }
    }
  }

  function drawTrails() {
    for (var i = 0; i < trails.length; i++) {
      var t = trails[i];
      ctx.fillStyle = 'rgba(74, 222, 128, ' + (t.life * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(t.x, t.y, cellSize * 0.3 * t.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function resizeCanvas() {
    var container = canvas.parentElement;
    var size = Math.min(container.clientWidth, 400);
    canvas.width = size;
    canvas.height = size;
    cellSize = size / GRID_SIZE;
    initBgParticles();
  }

  function drawGrid() {
    var gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawBgParticles();
    
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.05)';
    ctx.lineWidth = 1;
    
    for (var i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
    }
    
    for (var j = 0; j <= ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellSize);
      ctx.lineTo(canvas.width, j * cellSize);
      ctx.stroke();
    }
  }

  function drawSnake() {
    drawTrails();
    
    if (hasShield) {
      var head = snake[0];
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        head.x * cellSize + cellSize / 2,
        head.y * cellSize + cellSize / 2,
        cellSize * 1.5,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    
    for (var index = snake.length - 1; index >= 0; index--) {
      var segment = snake[index];
      var isHead = index === 0;
      var progress = index / snake.length;
      
      var centerX = segment.x * cellSize + cellSize / 2;
      var centerY = segment.y * cellSize + cellSize / 2;
      
      if (isHead) {
        ctx.shadowColor = hasShield ? '#3b82f6' : '#4ade80';
        ctx.shadowBlur = 20;
        
        var headGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, cellSize / 2
        );
        if (hasShield) {
          headGradient.addColorStop(0, '#93c5fd');
          headGradient.addColorStop(0.5, '#3b82f6');
          headGradient.addColorStop(1, '#1d4ed8');
        } else {
          headGradient.addColorStop(0, '#86efac');
          headGradient.addColorStop(0.5, '#4ade80');
          headGradient.addColorStop(1, '#22c55e');
        }
        
        ctx.fillStyle = headGradient;
        roundRect(
          segment.x * cellSize + 2,
          segment.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4,
          6
        );
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        var eyeSize = cellSize / 5;
        var eyeOffset = cellSize / 3;
        
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        if (direction.x === 1) {
          ctx.arc(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + cellSize - eyeOffset, eyeSize, 0, Math.PI * 2);
        } else if (direction.x === -1) {
          ctx.arc(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * cellSize + eyeOffset, segment.y * cellSize + cellSize - eyeOffset, eyeSize, 0, Math.PI * 2);
        } else if (direction.y === -1) {
          ctx.arc(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, 0, Math.PI * 2);
        } else {
          ctx.arc(segment.x * cellSize + eyeOffset, segment.y * cellSize + cellSize - eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + cellSize - eyeOffset, eyeSize, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        var alpha = 1 - progress * 0.6;
        var hue = 140 + progress * 20;
        
        ctx.shadowColor = 'hsla(' + hue + ', 70%, 50%, ' + alpha + ')';
        ctx.shadowBlur = 8;
        
        var bodyGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, cellSize / 2
        );
        bodyGradient.addColorStop(0, 'hsla(' + hue + ', 70%, 60%, ' + alpha + ')');
        bodyGradient.addColorStop(1, 'hsla(' + hue + ', 70%, 40%, ' + alpha + ')');
        
        ctx.fillStyle = bodyGradient;
        
        var pulseSize = Math.sin(time * 0.1 + index * 0.5) * 1;
        roundRect(
          segment.x * cellSize + 3 - pulseSize / 2,
          segment.y * cellSize + 3 - pulseSize / 2,
          cellSize - 6 + pulseSize,
          cellSize - 6 + pulseSize,
          5
        );
        ctx.fill();
        
        ctx.shadowBlur = 0;
      }
    }
  }

  function drawFood() {
    if (hasMagnet) {
      var headX = snake[0].x * cellSize + cellSize / 2;
      var headY = snake[0].y * cellSize + cellSize / 2;
      var foodX = food.x * cellSize + cellSize / 2;
      var foodY = food.y * cellSize + cellSize / 2;
      
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(foodX, foodY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }
    
    foodPulse += 0.1;
    var pulse = Math.sin(foodPulse) * 0.2 + 1;
    var glowPulse = Math.sin(foodPulse * 2) * 0.3 + 0.7;
    
    var centerX = food.x * cellSize + cellSize / 2;
    var centerY = food.y * cellSize + cellSize / 2;
    
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 25 * glowPulse;
    
    var outerGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, cellSize * pulse
    );
    outerGlow.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    outerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    var gradient = ctx.createRadialGradient(
      centerX - cellSize / 6, centerY - cellSize / 6, 0,
      centerX, centerY, cellSize / 2 * pulse
    );
    gradient.addColorStop(0, '#fca5a5');
    gradient.addColorStop(0.4, '#f87171');
    gradient.addColorStop(0.8, '#ef4444');
    gradient.addColorStop(1, '#dc2626');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize / 2 * pulse - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - cellSize / 6, centerY - cellSize / 6, cellSize / 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }

  function drawPowerUps() {
    for (var i = 0; i < powerUps.length; i++) {
      var pu = powerUps[i];
      var type = POWER_UP_TYPES[pu.type];
      var pulse = Math.sin(time * 0.15 + i) * 0.15 + 1;
      
      var centerX = pu.x * cellSize + cellSize / 2;
      var centerY = pu.y * cellSize + cellSize / 2;
      
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 20;
      
      var gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, cellSize / 2 * pulse
      );
      gradient.addColorStop(0, type.color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, cellSize / 2 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      ctx.font = (cellSize * 0.6) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(type.icon, centerX, centerY);
    }
  }

  function drawActivePowerUps() {
    var y = 10;
    var keys = Object.keys(activePowerUps);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (activePowerUps[key]) {
        var remaining = Math.ceil((activePowerUps[key] - Date.now()) / 1000);
        if (remaining > 0) {
          var type = POWER_UP_TYPES[key.toUpperCase()];
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          roundRect(10, y, 80, 24, 6);
          ctx.fill();
          
          ctx.font = '12px Arial';
          ctx.fillStyle = type.color;
          ctx.textAlign = 'left';
          ctx.fillText(type.icon + ' ' + remaining + 's', 18, y + 16);
          
          y += 30;
        }
      }
    }
  }

  function spawnFood() {
    var newFood;
    var valid = false;
    var attempts = 0;
    
    while (!valid && attempts < 100) {
      newFood = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
      valid = true;
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === newFood.x && snake[i].y === newFood.y) {
          valid = false;
          break;
        }
      }
      for (var j = 0; j < powerUps.length; j++) {
        if (powerUps[j].x === newFood.x && powerUps[j].y === newFood.y) {
          valid = false;
          break;
        }
      }
      attempts++;
    }
    food = newFood;
    foodPulse = 0;
  }

  function spawnPowerUp() {
    if (powerUps.length >= 2 || Math.random() > 0.15) return;
    
    var types = Object.keys(POWER_UP_TYPES);
    var type = types[Math.floor(Math.random() * types.length)];
    
    var pos;
    var valid = false;
    var attempts = 0;
    
    while (!valid && attempts < 100) {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
        type: type
      };
      valid = true;
      
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === pos.x && snake[i].y === pos.y) {
          valid = false;
          break;
        }
      }
      if (food.x === pos.x && food.y === pos.y) valid = false;
      
      attempts++;
    }
    
    if (valid) {
      powerUps.push(pos);
      setTimeout(function() {
        var idx = powerUps.indexOf(pos);
        if (idx > -1) powerUps.splice(idx, 1);
      }, 8000);
    }
  }

  function activatePowerUp(type) {
    var typeInfo = POWER_UP_TYPES[type];
    
    switch (type) {
      case 'SPEED':
        speed = Math.max(50, baseSpeed - 50);
        clearInterval(gameLoop);
        gameLoop = setInterval(update, speed);
        activePowerUps.speed = Date.now() + typeInfo.duration;
        setTimeout(function() {
          speed = baseSpeed;
          clearInterval(gameLoop);
          gameLoop = setInterval(update, speed);
          activePowerUps.speed = null;
        }, typeInfo.duration);
        break;
        
      case 'SHIELD':
        hasShield = true;
        activePowerUps.shield = Date.now() + typeInfo.duration;
        setTimeout(function() {
          hasShield = false;
          activePowerUps.shield = null;
        }, typeInfo.duration);
        break;
        
      case 'DOUBLE_SCORE':
        hasDoubleScore = true;
        activePowerUps.doubleScore = Date.now() + typeInfo.duration;
        setTimeout(function() {
          hasDoubleScore = false;
          activePowerUps.doubleScore = null;
        }, typeInfo.duration);
        break;
        
      case 'SHRINK':
        if (snake.length > 3) {
          for (var i = 0; i < 3 && snake.length > 3; i++) {
            snake.pop();
          }
        }
        break;
        
      case 'MAGNET':
        hasMagnet = true;
        activePowerUps.magnet = Date.now() + typeInfo.duration;
        setTimeout(function() {
          hasMagnet = false;
          activePowerUps.magnet = null;
        }, typeInfo.duration);
        break;
    }
  }

  function startGame() {
    snake = [
      { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) },
      { x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 2) },
      { x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 2) }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = 150;
    baseSpeed = 150;
    scoreEl.textContent = score;
    particles = [];
    trails = [];
    powerUps = [];
    hasShield = false;
    hasDoubleScore = false;
    hasMagnet = false;
    activePowerUps = { speed: null, shield: null, doubleScore: null, magnet: null };
    
    spawnFood();
    
    gameRunning = true;
    gamePaused = false;
    overlay.classList.add('hidden');
    startBtn.textContent = '重新开始';
    pauseBtn.disabled = false;
    pauseBtn.textContent = '暂停';
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
    
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animate();
  }

  function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      clearInterval(gameLoop);
      pauseBtn.textContent = '继续';
      overlayTitle.textContent = '游戏暂停';
      overlayText.textContent = '按空格键或点击继续';
      overlay.classList.remove('hidden');
    } else {
      gameLoop = setInterval(update, speed);
      pauseBtn.textContent = '暂停';
      overlay.classList.add('hidden');
    }
  }

  function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    var headX = snake[0].x * cellSize + cellSize / 2;
    var headY = snake[0].y * cellSize + cellSize / 2;
    
    for (var i = 0; i < 5; i++) {
      setTimeout(function() {
        createExplosion(headX + (Math.random() - 0.5) * 40, headY + (Math.random() - 0.5) * 40);
      }, i * 100);
    }
    
    setTimeout(function() {
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        saveHighScore(highScore);
        overlayTitle.textContent = '新纪录！';
      } else {
        overlayTitle.textContent = '游戏结束';
      }
      
      overlayText.textContent = '得分: ' + score + ' | 点击重新开始';
      overlay.classList.remove('hidden');
      pauseBtn.disabled = true;
    }, 600);
  }

  function update() {
    direction = { x: nextDirection.x, y: nextDirection.y };
    
    var head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      if (hasShield) {
        if (head.x < 0) head.x = COLS - 1;
        if (head.x >= COLS) head.x = 0;
        if (head.y < 0) head.y = ROWS - 1;
        if (head.y >= ROWS) head.y = 0;
      } else {
        gameOver();
        return;
      }
    }
    
    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        if (!hasShield) {
          gameOver();
          return;
        }
      }
    }
    
    addTrail(snake[0].x * cellSize + cellSize / 2, snake[0].y * cellSize + cellSize / 2);
    
    snake.unshift(head);
    
    if (hasMagnet) {
      var dx = food.x - head.x;
      var dy = food.y - head.y;
      if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) {
        if (Math.random() > 0.7) {
          if (Math.abs(dx) > Math.abs(dy)) {
            nextDirection = { x: dx > 0 ? 1 : -1, y: 0 };
          } else {
            nextDirection = { x: 0, y: dy > 0 ? 1 : -1 };
          }
        }
      }
    }
    
    if (head.x === food.x && head.y === food.y) {
      var points = hasDoubleScore ? 20 : 10;
      score += points;
      scoreEl.textContent = score;
      
      createExplosion(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2);
      
      spawnFood();
      spawnPowerUp();
      
      if (speed > 80) {
        speed -= 2;
        baseSpeed = speed;
        clearInterval(gameLoop);
        gameLoop = setInterval(update, speed);
      }
    } else {
      snake.pop();
    }
    
    for (var j = powerUps.length - 1; j >= 0; j--) {
      var pu = powerUps[j];
      if (head.x === pu.x && head.y === pu.y) {
        createExplosion(pu.x * cellSize + cellSize / 2, pu.y * cellSize + cellSize / 2, POWER_UP_TYPES[pu.type].color);
        activatePowerUp(pu.type);
        powerUps.splice(j, 1);
      }
    }
  }

  function animate() {
    time++;
    updateBgParticles();
    updateParticles();
    updateTrails();
    
    draw();
    
    if (gameRunning || particles.length > 0 || trails.length > 0) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  function draw() {
    drawGrid();
    if (gameRunning || snake.length > 0) {
      drawFood();
      drawPowerUps();
      drawSnake();
    }
    drawParticles();
    drawActivePowerUps();
  }

  function handleKeydown(e) {
    var key = e.key.toLowerCase();
    
    if (key === ' ' || key === 'enter') {
      e.preventDefault();
      if (!gameRunning) {
        startGame();
      } else {
        pauseGame();
      }
      return;
    }
    
    if (!gameRunning || gamePaused) return;
    
    if ((key === 'arrowup' || key === 'w') && direction.y !== 1) {
      e.preventDefault();
      nextDirection = { x: 0, y: -1 };
    } else if ((key === 'arrowdown' || key === 's') && direction.y !== -1) {
      e.preventDefault();
      nextDirection = { x: 0, y: 1 };
    } else if ((key === 'arrowleft' || key === 'a') && direction.x !== 1) {
      e.preventDefault();
      nextDirection = { x: -1, y: 0 };
    } else if ((key === 'arrowright' || key === 'd') && direction.x !== -1) {
      e.preventDefault();
      nextDirection = { x: 1, y: 0 };
    }
  }

  function saveHighScore(score) {
    if (window.app && window.app.storage) {
      window.app.storage.set('highScore', score).catch(function() {});
    }
  }

  async function loadHighScore() {
    if (window.app && window.app.storage) {
      try {
        var v = await window.app.storage.get('highScore');
        if (typeof v === 'number') {
          highScore = v;
          highScoreEl.textContent = highScore;
        }
      } catch (e) {}
    }
  }

  async function init() {
    resizeCanvas();
    await loadHighScore();
    drawGrid();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', handleKeydown);
    
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    
    var controlBtns = document.querySelectorAll('.control-btn');
    for (var i = 0; i < controlBtns.length; i++) {
      controlBtns[i].addEventListener('click', function() {
        if (!gameRunning) {
          startGame();
          return;
        }
        
        var dir = this.dataset.dir;
        if (dir === 'up' && direction.y !== 1) {
          nextDirection = { x: 0, y: -1 };
        } else if (dir === 'down' && direction.y !== -1) {
          nextDirection = { x: 0, y: 1 };
        } else if (dir === 'left' && direction.x !== 1) {
          nextDirection = { x: -1, y: 0 };
        } else if (dir === 'right' && direction.x !== -1) {
          nextDirection = { x: 1, y: 0 };
        }
      });
    }
    
    overlay.addEventListener('click', function() {
      if (!gameRunning) {
        startGame();
      } else if (gamePaused) {
        pauseGame();
      }
    });
    
    animate();
  }

  init();
})();
