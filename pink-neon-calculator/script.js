/* ============================================
   PINK NEON CALCULATOR — JavaScript Engine
   ============================================ */

(() => {
  'use strict';

  // ---- DOM Elements ----
  const display = document.getElementById('display');
  const expression = document.getElementById('expression');
  const calculator = document.getElementById('calculator');
  const bgParticles = document.getElementById('bgParticles');

  // ---- Calculator State ----
  let currentInput = '0';
  let previousInput = '';
  let operator = null;
  let shouldResetDisplay = false;
  let lastResult = null;
  let hasError = false;

  // ---- Audio Context for Click Sounds ----
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playClickSound(type = 'number') {
    try {
      initAudio();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const freqMap = {
        number: 800,
        operator: 600,
        equals: 1000,
        clear: 400,
        delete: 500,
        error: 200
      };

      oscillator.frequency.setValueAtTime(freqMap[type] || 800, audioCtx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Silently fail if audio is not supported
    }
  }

  // ---- Background Particles ----
  function createParticles() {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');

      const size = Math.random() * 4 + 1;
      const left = Math.random() * 100;
      const duration = Math.random() * 8 + 6;
      const delay = Math.random() * 10;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${left}%`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.background = Math.random() > 0.5
        ? 'var(--neon-pink)'
        : 'var(--neon-purple)';

      bgParticles.appendChild(particle);
    }
  }

  // ---- Display Helpers ----
  function updateDisplay() {
    display.textContent = currentInput;
    display.classList.remove('error');
    hasError = false;

    // Auto-shrink font for long numbers
    if (currentInput.length > 12) {
      display.style.fontSize = '1.6rem';
    } else if (currentInput.length > 9) {
      display.style.fontSize = '2rem';
    } else {
      display.style.fontSize = '';
    }
  }

  function updateExpression() {
    if (previousInput && operator) {
      expression.textContent = `${previousInput} ${operator}`;
    } else {
      expression.textContent = '';
    }
  }

  function showError(msg = 'Invalid Input') {
    currentInput = msg;
    display.textContent = msg;
    display.classList.add('error');
    hasError = true;
    playClickSound('error');

    setTimeout(() => {
      if (hasError) {
        clearAll();
      }
    }, 1500);
  }

  function flashResult() {
    display.classList.remove('result-flash');
    void display.offsetWidth; // trigger reflow
    display.classList.add('result-flash');
  }

  // ---- Input Handling ----
  function inputNumber(num) {
    if (hasError) clearAll();

    if (shouldResetDisplay) {
      currentInput = num;
      shouldResetDisplay = false;
    } else {
      if (currentInput === '0' && num !== '.') {
        currentInput = num;
      } else {
        // Limit input length
        if (currentInput.length >= 16) return;
        currentInput += num;
      }
    }

    updateDisplay();
    playClickSound('number');
  }

  function inputDecimal() {
    if (hasError) clearAll();

    if (shouldResetDisplay) {
      currentInput = '0.';
      shouldResetDisplay = false;
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }

    updateDisplay();
    playClickSound('number');
  }

  function inputOperator(op) {
    if (hasError) clearAll();

    // If there's a pending operation, calculate first
    if (operator && !shouldResetDisplay) {
      calculate();
    }

    previousInput = currentInput;
    operator = op;
    shouldResetDisplay = true;

    updateExpression();
    highlightActiveOperator(op);
    playClickSound('operator');
  }

  function highlightActiveOperator(op) {
    // Remove active class from all operators
    document.querySelectorAll('.btn-operator').forEach(btn => {
      btn.classList.remove('active');
    });

    // Add active class to selected operator
    const opMap = { '+': 'btn-add', '−': 'btn-subtract', '×': 'btn-multiply', '÷': 'btn-divide' };
    const activeBtn = document.getElementById(opMap[op]);
    if (activeBtn) activeBtn.classList.add('active');
  }

  function clearActiveOperator() {
    document.querySelectorAll('.btn-operator').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  // ---- Calculation ----
  function calculate() {
    if (!operator || previousInput === '') return;

    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput);
    let result;

    if (isNaN(prev) || isNaN(curr)) {
      showError('Invalid Input');
      return;
    }

    switch (operator) {
      case '+':
        result = prev + curr;
        break;
      case '−':
        result = prev - curr;
        break;
      case '×':
        result = prev * curr;
        break;
      case '÷':
        if (curr === 0) {
          showError('Cannot ÷ by 0');
          return;
        }
        result = prev / curr;
        break;
      default:
        return;
    }

    // Format result
    const fullExpression = `${previousInput} ${operator} ${currentInput}`;
    expression.textContent = fullExpression;

    // Round to avoid floating point weirdness
    result = parseFloat(result.toPrecision(12));

    // Check for infinity or NaN
    if (!isFinite(result) || isNaN(result)) {
      showError('Error');
      return;
    }

    currentInput = String(result);
    lastResult = result;
    operator = null;
    previousInput = '';
    shouldResetDisplay = true;

    updateDisplay();
    flashResult();
    clearActiveOperator();
    playClickSound('equals');
  }

  function handlePercent() {
    if (hasError) clearAll();

    const value = parseFloat(currentInput);
    if (isNaN(value)) {
      showError('Invalid Input');
      return;
    }

    currentInput = String(value / 100);
    updateDisplay();
    playClickSound('operator');
  }

  // ---- Clear / Delete ----
  function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetDisplay = false;
    lastResult = null;
    hasError = false;

    updateDisplay();
    updateExpression();
    clearActiveOperator();
    playClickSound('clear');
  }

  function deleteLast() {
    if (hasError) {
      clearAll();
      return;
    }

    if (shouldResetDisplay) {
      clearAll();
      return;
    }

    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
    } else {
      currentInput = '0';
    }

    updateDisplay();
    playClickSound('delete');
  }

  // ---- Button Click Handler ----
  function handleButtonClick(e) {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    // Ripple / press animation
    btn.classList.remove('pressed');
    void btn.offsetWidth;
    btn.classList.add('pressed');

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    switch (action) {
      case 'number':
        inputNumber(value);
        break;
      case 'decimal':
        inputDecimal();
        break;
      case 'operator':
        inputOperator(value);
        break;
      case 'equals':
        calculate();
        break;
      case 'clear':
        clearAll();
        break;
      case 'delete':
        deleteLast();
        break;
      case 'percent':
        handlePercent();
        break;
    }
  }

  // ---- Keyboard Support ----
  function handleKeyboard(e) {
    const key = e.key;

    // Prevent default for calculator keys
    if (['Enter', 'Backspace', 'Delete', 'Escape', '%'].includes(key) ||
        /^[0-9.+\-*/]$/.test(key)) {
      e.preventDefault();
    }

    // Number keys
    if (/^[0-9]$/.test(key)) {
      inputNumber(key);
      simulateKeyPress(`btn-${key}`);
      return;
    }

    // Decimal
    if (key === '.') {
      inputDecimal();
      simulateKeyPress('btn-decimal');
      return;
    }

    // Operators
    const operatorMap = {
      '+': { op: '+', btnId: 'btn-add' },
      '-': { op: '−', btnId: 'btn-subtract' },
      '*': { op: '×', btnId: 'btn-multiply' },
      '/': { op: '÷', btnId: 'btn-divide' }
    };

    if (operatorMap[key]) {
      inputOperator(operatorMap[key].op);
      simulateKeyPress(operatorMap[key].btnId);
      return;
    }

    // Equals
    if (key === 'Enter' || key === '=') {
      calculate();
      simulateKeyPress('btn-equals');
      return;
    }

    // Delete
    if (key === 'Backspace') {
      deleteLast();
      simulateKeyPress('btn-delete');
      return;
    }

    // Clear
    if (key === 'Escape' || key === 'Delete') {
      clearAll();
      simulateKeyPress('btn-clear');
      return;
    }

    // Percent
    if (key === '%') {
      handlePercent();
      simulateKeyPress('btn-percent');
      return;
    }
  }

  function simulateKeyPress(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.classList.remove('pressed');
    void btn.offsetWidth;
    btn.classList.add('pressed');

    // Visual feedback
    btn.style.transform = 'scale(0.94)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 120);
  }

  // ---- Initialize ----
  function init() {
    // Create floating particles
    createParticles();

    // Button click events (event delegation)
    calculator.addEventListener('click', handleButtonClick);

    // Keyboard events
    document.addEventListener('keydown', handleKeyboard);

    // Initialize display
    updateDisplay();
    updateExpression();
  }

  // Start the calculator
  init();
})();
