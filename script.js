let currentStage = 0;
let stage1Code = '';
let stage1Input = '';
let stage2Code = [];
let stage2Selections = [];
let colorSequence = [];
let colorOrder = [];
let correctScrollItem = 0;
let scrollClicked = false;
let birthDateInput = '';
let userName = '';
let birthDate = '';
let startTime;
let timerInterval;
let puzzleCompleted = false;

// Audio kontekst və səslər
let audioContext;
let sounds = {};
let soundEnabled = true;

// Sayfa yüklendiğinde
window.onload = function() {
    updateProgress();
    initUIEnhancements();
};

// Yarışı başlat
function startCompetition() {
    playSound('click');
    userName = document.getElementById('userName').value.trim();
    birthDate = document.getElementById('birthDate').value.trim();
    
    if (!userName) {
        showMessage('Zəhmət olmasa adınızı daxil edin.', 'error');
        return;
    }
    
    if (!birthDate || birthDate.length !== 8 || isNaN(birthDate)) {
        showMessage('Zəhmət olmasa doğru formatda doğum tarixinizi daxil edin (GGAAİİİİ).', 'error');
        return;
    }
    
    showMessage('Yarış başlayır...', 'success');
    startTime = new Date();
    
    // Timer'ı başlat
    startTimer();
    
    setTimeout(() => {
        currentStage = 1;
        document.getElementById('registerStage').classList.remove('active');
        document.getElementById('stage1').classList.add('active');
        generateStage1Code();
        createShuffledNumpad('numpad1');
        updateProgress();
        clearMessage();
    }, 1500);
}

// UI Təkmilləşdirmələri
function initUIEnhancements() {
    initThemes();
    initSounds();
    initParticles();
}

// Temalar
function initThemes() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    setTheme(savedTheme);
    
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            localStorage.setItem('theme', theme);
        });
    });
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    
    // Aktiv düyməni göstər
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Səs effektləri
function initSounds() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const soundBtn = document.getElementById('soundBtn');
        soundBtn.addEventListener('click', toggleSound);
        
        loadSounds();
        
        // Hover səsləri əlavə et
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (soundEnabled) {
                    playSound('hover');
                }
            });
        });
    } catch (e) {
        console.log('Audio not supported');
        soundEnabled = false;
        document.getElementById('soundBtn').style.display = 'none';
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('soundBtn');
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    
    if (soundEnabled && audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function loadSounds() {
    sounds.click = createBeep(800, 0.1);
    sounds.success = createBeep(1200, 0.3);
    sounds.error = createBeep(400, 0.5);
    sounds.complete = createChord([1300, 1600, 2000], 0.8);
}

function createBeep(frequency, duration) {
    return function() {
        if (!soundEnabled || !audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    };
}

function createChord(frequencies, duration) {
    return function() {
        if (!soundEnabled || !audioContext) return;
        
        frequencies.forEach(freq => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        });
    };
}

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName]();
    }
}

// Particle effekti
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.color = this.getParticleColor();
            this.alpha = Math.random() * 0.5 + 0.2;
        }
        
        getParticleColor() {
            const theme = document.body.getAttribute('data-theme') || 'light';
            const colors = {
                light: ['#6a11cb', '#2575fc', '#4CAF50'],
                dark: ['#bb86fc', '#03dac6', '#cf6679'],
                neon: ['#ff00ff', '#00ffff', '#00ff00'],
                retro: ['#ff6b6b', '#4ecdc4', '#1a936f']
            };
            return colors[theme][Math.floor(Math.random() * colors[theme].length)];
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Timer'ı başlat
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 10);
}

// Timer'ı güncelle
function updateTimer() {
    const currentTime = new Date();
    const timeDiff = currentTime - startTime;
    
    const hours = Math.floor(timeDiff / 3600000);
    const minutes = Math.floor((timeDiff % 3600000) / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    const milliseconds = Math.floor((timeDiff % 1000) / 10);
    
    document.getElementById('timer').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
}

// İlerleme çubuğunu güncelle
function updateProgress() {
    const progress = document.getElementById('progress');
    progress.style.width = ((currentStage) / 7 * 100) + '%';
}

// Karışık numpad oluştur
function createShuffledNumpad(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 10; i++) {
        const buttonEl = document.createElement('button');
        buttonEl.textContent = shuffledNumbers[i];
        buttonEl.className = 'btn-hover';
        
        if (containerId === 'numpad1') {
            buttonEl.onclick = () => {
                playSound('click');
                addNumber(shuffledNumbers[i]);
            };
        } else if (containerId === 'numpad5') {
            buttonEl.onclick = () => {
                playSound('click');
                addBirthDateNumber(shuffledNumbers[i]);
            };
        }
        
        container.appendChild(buttonEl);
    }
    
    const emptyButton = document.createElement('button');
    emptyButton.style.visibility = 'hidden';
    container.appendChild(emptyButton);
}

// 1. Aşama için rastgele kod oluştur
function generateStage1Code() {
    stage1Code = '';
    for (let i = 0; i < 6; i++) {
        stage1Code += Math.floor(Math.random() * 10);
    }
    document.getElementById('code1').textContent = stage1Code;
    document.getElementById('input1').textContent = '';
    stage1Input = '';
}

// 1. Aşama için numpad işlevleri
function addNumber(num) {
    if (stage1Input.length < 6) {
        stage1Input += num;
        document.getElementById('input1').textContent = stage1Input;
    }
}

function clearInput() {
    playSound('click');
    stage1Input = '';
    document.getElementById('input1').textContent = '';
}

// 1. Aşama kontrolü
function checkStage1() {
    playSound('click');
    if (stage1Input === stage1Code) {
        playSound('success');
        showMessage('Doğru! Növbəti mərhələyə keçilir...', 'success');
        setTimeout(() => {
            currentStage = 2;
            document.getElementById('stage1').classList.remove('active');
            document.getElementById('stage2').classList.add('active');
            generateStage2Code();
            updateProgress();
            clearMessage();
        }, 1500);
    } else {
        playSound('error');
        showMessage('Kod yanlışdır. Yenidən cəhd edin.', 'error');
        generateStage1Code();
        clearInput();
        createShuffledNumpad('numpad1');
    }
}

// 2. Aşama için rastgele kod oluştur
function generateStage2Code() {
    stage2Code = [];
    for (let i = 0; i < 6; i++) {
        stage2Code.push(Math.floor(Math.random() * 10));
    }
    
    document.getElementById('code2').textContent = stage2Code.join(' ');
    
    const container = document.getElementById('dropdownContainer');
    container.innerHTML = '';
    stage2Selections = [];
    
    for (let i = 0; i < 6; i++) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        
        const span = document.createElement('span');
        span.textContent = stage2Code[i];
        
        const select = document.createElement('select');
        select.id = 'dropdown' + i;
        
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-';
        emptyOption.disabled = true;
        emptyOption.selected = true;
        select.appendChild(emptyOption);
        
        for (let j = 0; j <= 9; j++) {
            const option = document.createElement('option');
            option.value = j;
            option.textContent = j;
            select.appendChild(option);
        }
        
        select.addEventListener('change', function() {
            playSound('click');
            stage2Selections[i] = this.value === '' ? null : parseInt(this.value);
        });
        
        item.appendChild(span);
        item.appendChild(select);
        container.appendChild(item);
        
        stage2Selections[i] = null;
    }
}

// 2. Aşama kontrolü
function checkStage2() {
    playSound('click');
    let correct = true;
    for (let i = 0; i < 6; i++) {
        if (stage2Selections[i] !== stage2Code[i]) {
            correct = false;
            break;
        }
    }
    
    if (correct) {
        playSound('success');
        showMessage('Doğru! Növbəti mərhələyə keçilir...', 'success');
        setTimeout(() => {
            currentStage = 3;
            document.getElementById('stage2').classList.remove('active');
            document.getElementById('stage3').classList.add('active');
            generateColorStage();
            updateProgress();
            clearMessage();
        }, 1500);
    } else {
        playSound('error');
        showMessage('Seçimlər yanlışdır. Yenidən cəhd edin.', 'error');
        generateStage2Code();
    }
}

// 3. Aşama için renk butonlarını oluştur
function generateColorStage() {
    const colors = [
        { name: 'Qırmızı', value: 'red', color: '#f44336' },
        { name: 'Yaşıl', value: 'green', color: '#4CAF50' },
        { name: 'Mavi', value: 'blue', color: '#2196F3' },
        { name: 'Sarı', value: 'yellow', color: '#FFEB3B' },
        { name: 'Bənövşəyi', value: 'purple', color: '#9C27B0' },
        { name: 'Narıncı', value: 'orange', color: '#FF9800' }
    ];
    
    colorSequence = [];
    const selectedColors = [];
    
    while (selectedColors.length < 4) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        if (!selectedColors.includes(colors[randomIndex])) {
            selectedColors.push(colors[randomIndex]);
            colorSequence.push(colors[randomIndex].value);
        }
    }
    
    document.getElementById('colorSequence').textContent = 
        selectedColors.map(c => c.name).join(' → ');
    
    const shuffledColors = [...selectedColors].sort(() => Math.random() - 0.5);
    
    const container = document.getElementById('colorButtons');
    container.innerHTML = '';
    colorOrder = [];
    
    shuffledColors.forEach((colorObj) => {
        const button = document.createElement('button');
        button.className = 'color-button btn-hover';
        button.style.backgroundColor = colorObj.color;
        button.textContent = colorObj.name;
        button.dataset.value = colorObj.value;
        
        button.addEventListener('click', function() {
            playSound('click');
            if (!colorOrder.includes(this.dataset.value)) {
                colorOrder.push(this.dataset.value);
                this.style.opacity = '0.5';
                this.style.cursor = 'default';
                this.onclick = null;
            }
        });
        
        container.appendChild(button);
    });
}

// 3. Aşama kontrolü
function checkStage3() {
    playSound('click');
    if (JSON.stringify(colorOrder) === JSON.stringify(colorSequence)) {
        playSound('success');
        showMessage('Doğru! Növbəti mərhələyə keçilir...', 'success');
        setTimeout(() => {
            currentStage = 4;
            document.getElementById('stage3').classList.remove('active');
            document.getElementById('stage4').classList.add('active');
            generateScrollStage();
            updateProgress();
            clearMessage();
        }, 1500);
    } else {
        playSound('error');
        showMessage('Rəng sıralaması yanlışdır. Yenidən cəhd edin.', 'error');
        generateColorStage();
    }
}

// 4. Aşama için scroll testi oluştur
function generateScrollStage() {
    const container = document.getElementById('scrollContainer');
    container.innerHTML = '';
    scrollClicked = false;
    
    const itemCount = Math.floor(Math.random() * 21) + 30;
    correctScrollItem = Math.floor(Math.random() * itemCount);
    
    for (let i = 0; i < itemCount; i++) {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        
        const text = document.createElement('span');
        text.textContent = `Element ${i + 1}`;
        
        const button = document.createElement('button');
        button.textContent = 'SEÇ';
        button.className = 'btn-hover';
        
        if (i === correctScrollItem) {
            button.style.backgroundColor = '#4CAF50';
            button.onclick = function() {
                playSound('success');
                scrollClicked = true;
                this.style.backgroundColor = '#2E7D32';
                this.textContent = 'SEÇİLDİ';
                this.onclick = null;
            };
        } else {
            button.style.backgroundColor = '#f44336';
            button.onclick = function() {
                playSound('error');
                showMessage('Yanlış element! Doğru elementi tapın.', 'error');
            };
        }
        
        item.appendChild(text);
        item.appendChild(button);
        container.appendChild(item);
    }
    
    container.scrollTop = container.scrollHeight;
}

// 4. Aşama kontrolü
function checkStage4() {
    playSound('click');
    if (scrollClicked) {
        playSound('success');
        showMessage('Doğru! Növbəti mərhələyə keçilir...', 'success');
        setTimeout(() => {
            currentStage = 5;
            document.getElementById('stage4').classList.remove('active');
            document.getElementById('stage5').classList.add('active');
            createShuffledNumpad('numpad5');
            birthDateInput = '';
            document.getElementById('birthDateInput').textContent = '';
            updateProgress();
            clearMessage();
        }, 1500);
    } else {
        playSound('error');
        showMessage('Zəhmət olmasa doğru elementi seçin.', 'error');
    }
}

// 5. Aşama için doğum tarihi girişi fonksiyonları
function addBirthDateNumber(num) {
    if (birthDateInput.length < 8) {
        birthDateInput += num;
        document.getElementById('birthDateInput').textContent = birthDateInput;
    }
}

function clearBirthDateInput() {
    playSound('click');
    birthDateInput = '';
    document.getElementById('birthDateInput').textContent = '';
}

// 5. Aşama kontrolü
function checkStage5() {
    playSound('click');
    if (birthDateInput === birthDate) {
        playSound('success');
        showMessage('Doğru! Növbəti mərhələyə keçilir...', 'success');
        setTimeout(() => {
            currentStage = 6;
            document.getElementById('stage5').classList.remove('active');
            document.getElementById('stage6').classList.add('active');
            setupPuzzleStage();
            updateProgress();
            clearMessage();
        }, 1500);
    } else {
        playSound('error');
        showMessage('Doğum tarixi yanlışdır. Yenidən cəhd edin.', 'error');
        clearBirthDateInput();
        createShuffledNumpad('numpad5');
    }
}

// 6. Aşama için drag to verify kurulumu
function setupPuzzleStage() {
    puzzleCompleted = false;
    const dragSlider = document.getElementById('dragSlider');
    const dragTrack = document.querySelector('.drag-track');
    const trackWidth = dragTrack.offsetWidth - dragSlider.offsetWidth;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    // Reset slider position
    dragSlider.style.left = '0px';
    dragSlider.style.background = 'linear-gradient(45deg, var(--primary-color), var(--secondary-color))';
    document.querySelector('.slider-text').style.display = 'none';
    document.querySelector('.slider-handle').style.display = 'flex';
    document.querySelector('.drag-text').style.display = 'flex';

    // Mouse events
    dragSlider.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    // Touch events for mobile
    dragSlider.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', stopDrag);

    function startDrag(e) {
        playSound('click');
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        dragSlider.style.transition = 'none';
    }

    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const diff = currentX - startX;
        
        let newX = Math.max(0, Math.min(diff, trackWidth));
        dragSlider.style.left = newX + 'px';
        
        if (newX >= trackWidth - 10) {
            puzzleCompleted = true;
            playSound('success');
            dragSlider.style.background = '#4CAF50';
            document.querySelector('.slider-text').style.display = 'block';
            document.querySelector('.slider-handle').style.display = 'none';
            document.querySelector('.drag-text').style.display = 'none';
            showMessage('Doğrulama tamamlandı!', 'success');
            stopDrag();
        }
    }

    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;
        
        if (!puzzleCompleted) {
            dragSlider.style.transition = 'left 0.3s ease';
            dragSlider.style.left = '0px';
        }
    }
}

// 6. Aşama kontrolü
function checkStage6() {
    playSound('click');
    if (puzzleCompleted) {
        playSound('success');
        showMessage('Doğru! Növbəti mərhələyə keçilir...', 'success');
        setTimeout(() => {
            currentStage = 7;
            document.getElementById('stage6').classList.remove('active');
            document.getElementById('stage7').classList.add('active');
            updateProgress();
            clearMessage();
        }, 1500);
    } else {
        playSound('error');
        showMessage('Zəhmət olmasa doğrulama üçün sürüşdürün.', 'error');
    }
}

// 7. Aşama kontrolü
function checkStage7() {
    playSound('click');
    const nameInput = document.getElementById('nameInput').value.toUpperCase();
    const formattedUserName = userName.toUpperCase();
    
    if (nameInput === formattedUserName) {
        playSound('complete');
        showMessage('Doğru! Test tamamlandı.', 'success');
        setTimeout(() => {
            currentStage = 8;
            document.getElementById('stage7').classList.remove('active');
            document.getElementById('resultStage').classList.add('active');
            showResults();
            updateProgress();
            clearMessage();
        }, 1500);
    } else {
        playSound('error');
        showMessage('Ad və soyad yanlışdır. Yenidən cəhd edin.', 'error');
        document.getElementById('nameInput').value = '';
    }
}

// Sonuçları göster
function showResults() {
    clearInterval(timerInterval);
    const endTime = new Date();
    const timeDiff = (endTime - startTime) / 1000;
    
    const resultContent = document.getElementById('resultContent');
    resultContent.innerHTML = '';
    
    const timeResult = document.createElement('p');
    timeResult.id = 'timeResult';
    timeResult.textContent = `Bütün testi ${timeDiff.toFixed(2)} saniyədə tamamladınız.`;
    resultContent.appendChild(timeResult);
    
    if (timeDiff >= 10 && timeDiff <= 40) {
        const winnerText = document.createElement('h2');
        winnerText.className = 'winner-text';
        winnerText.textContent = 'Təbriklər siz evi qazandınız!';
        resultContent.appendChild(winnerText);
        
        const houseImage = document.createElement('div');
        houseImage.className = 'house-image';
        const img = document.createElement('img');
        img.src = 'https://i.pinimg.com/736x/90/28/b4/9028b4f8e4144addf59a9890e5c1826a.jpg';
        img.alt = 'Qazandığınız Ev';
        houseImage.appendChild(img);
        resultContent.appendChild(houseImage);
        
        createConfetti();
    } else if (timeDiff > 40 && timeDiff <= 50) {
        const loserText = document.createElement('h2');
        loserText.className = 'loser-text';
        loserText.textContent = 'Ev başqası tərəfindən tutulub!';
        resultContent.appendChild(loserText);
        
        const sadIcon = document.createElement('div');
        sadIcon.className = 'house-icon';
        sadIcon.innerHTML = '😞';
        sadIcon.style.animation = 'none';
        resultContent.appendChild(sadIcon);
    } else {
        // 60+ saniyə - Video göstər
        const practiceText = document.createElement('h2');
        practiceText.className = 'practice-text';
        practiceText.textContent = 'Siz zəif bəndsiniz, hələ məşq etməlisiniz!!!';
        resultContent.appendChild(practiceText);
        
        // Video elementi
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        
        const video = document.createElement('video');
        video.src = 'murad_getdi_rehmete.mp4';
        video.controls = true;
        video.autoplay = true;
        video.muted = false; // Səs aktiv
        video.className = 'result-video';
        
        videoContainer.appendChild(video);
        resultContent.appendChild(videoContainer);
        
        const exerciseIcon = document.createElement('div');
        exerciseIcon.className = 'house-icon';
        exerciseIcon.innerHTML = '💪';
        exerciseIcon.style.animation = 'pulse 1s infinite alternate';
        resultContent.appendChild(exerciseIcon);
    }
    
    resultContent.classList.add('result-animation');
}

// Konfeti efekti oluştur
function createConfetti() {
    const colors = ['#f44336', '#4CAF50', '#2196F3', '#FFEB3B', '#9C27B0', '#FF9800'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 7000);
    }
}

// Geri butonları
function backToStage1() {
    playSound('click');
    currentStage = 1;
    document.getElementById('stage2').classList.remove('active');
    document.getElementById('stage1').classList.add('active');
    updateProgress();
    clearMessage();
}

function backToStage2() {
    playSound('click');
    currentStage = 2;
    document.getElementById('stage3').classList.remove('active');
    document.getElementById('stage2').classList.add('active');
    updateProgress();
    clearMessage();
}

function backToStage3() {
    playSound('click');
    currentStage = 3;
    document.getElementById('stage4').classList.remove('active');
    document.getElementById('stage3').classList.add('active');
    updateProgress();
    clearMessage();
}

function backToStage4() {
    playSound('click');
    currentStage = 4;
    document.getElementById('stage5').classList.remove('active');
    document.getElementById('stage4').classList.add('active');
    updateProgress();
    clearMessage();
}

function backToStage5() {
    playSound('click');
    currentStage = 5;
    document.getElementById('stage6').classList.remove('active');
    document.getElementById('stage5').classList.add('active');
    updateProgress();
    clearMessage();
}

function backToStage6() {
    playSound('click');
    currentStage = 6;
    document.getElementById('stage7').classList.remove('active');
    document.getElementById('stage6').classList.add('active');
    updateProgress();
    clearMessage();
}

// Testi yeniden başlat
function restartTest() {
    playSound('click');
    currentStage = 0;
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '00:00:00';
    document.getElementById('resultStage').classList.remove('active');
    document.getElementById('registerStage').classList.add('active');
    document.getElementById('userName').value = '';
    document.getElementById('birthDate').value = '';
    document.getElementById('nameInput').value = '';
    updateProgress();
    clearMessage();
}

// Mesaj göster
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
}

// Mesajı temizle
function clearMessage() {
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    messageEl.className = 'message';
}