const AppState = {
    sets: new Map(),
    nextSetId: 1,
    universalSets: {
        'ℕ': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        '𝕎': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        'ℤ': [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
        'ℚ': [0.5, 1.5, 2.5, 3.5, 1/2, 2/3, 3/4],
        'ℝ': [1, 1.5, 2, 2.5, 3, Math.PI, Math.E],
        'ℚ′': [Math.PI, Math.E, Math.sqrt(2), Math.sqrt(3), Math.sqrt(5)]
    }
};

// مدیریت کیبورد - نسخه موبایل
let isKeyboardOpen = false;
let currentInput = null;

function toggleKB() {
    const kb = document.getElementById("keyboard");
    const kbBtn = document.getElementById("kbBtn");
    
    isKeyboardOpen = !isKeyboardOpen;
    kb.classList.toggle("active");
    kbBtn.classList.toggle("active");
    
    if (isKeyboardOpen) {
        // جلوگیری از اسکرول صفحه هنگام باز بودن کیبورد
        document.body.style.overflow = 'hidden';
        // اسکرول به پایین برای دیدن input
        setTimeout(() => {
            if (currentInput) {
                currentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    } else {
        document.body.style.overflow = '';
        // فوکوس روی input بعد از بستن کیبورد
        if (currentInput) {
            currentInput.focus();
        }
    }
}

function setCurrentInput(input) {
    currentInput = input;
    // مخفی کردن کیبورد معمولی موبایل
    if (input) {
        input.setAttribute('readonly', 'readonly');
        setTimeout(() => {
            input.removeAttribute('readonly');
        }, 100);
    }
}

function insertSymbol(symbol) {
    if (!currentInput) {
        // پیدا کردن اولین input اگر currentInput تنظیم نشده
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        if (inputs.length > 0) {
            currentInput = inputs[0];
        } else {
            showMessage('لطفاً ابتدا یک فیلد متنی را انتخاب کنید', 'error');
            return;
        }
    }
    
    const start = currentInput.selectionStart;
    const end = currentInput.selectionEnd;
    const value = currentInput.value;
    
    currentInput.value = value.substring(0, start) + symbol + value.substring(end);
    
    const newPosition = start + symbol.length;
    currentInput.setSelectionRange(newPosition, newPosition);
    currentInput.focus();
    
    // trigger input event برای محاسبات real-time
    currentInput.dispatchEvent(new Event('input'));
}

function backspace() {
    if (!currentInput) return;
    
    const start = currentInput.selectionStart;
    const end = currentInput.selectionEnd;
    const value = currentInput.value;
    
    if (start === end && start > 0) {
        currentInput.value = value.substring(0, start - 1) + value.substring(end);
        currentInput.setSelectionRange(start - 1, start - 1);
    } else if (start !== end) {
        currentInput.value = value.substring(0, start) + value.substring(end);
        currentInput.setSelectionRange(start, start);
    }
    
    currentInput.focus();
    currentInput.dispatchEvent(new Event('input'));
}

function insertSpace() {
    insertSymbol(' ');
}

// راه‌اندازی برنامه و اضافه کردن event listeners
document.addEventListener('DOMContentLoaded', function() {
    // اضافه کردن event listeners برای دکمه‌های اصلی
    document.getElementById('startBtn').addEventListener('click', start);
    document.getElementById('showSetsBtn').addEventListener('click', showAllSets);
    document.getElementById('addSetBtn').addEventListener('click', addNewSet);
    
    // اضافه کردن event listeners برای دکمه‌های کیبورد
    const keyboardButtons = document.querySelectorAll('.btn-keyboard[data-symbol]');
    keyboardButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            insertSymbol(this.getAttribute('data-symbol'));
        });
    });
    
    document.getElementById('backspaceBtn').addEventListener('click', backspace);
    document.getElementById('spaceBtn').addEventListener('click', insertSpace);
    
    // مدیریت فوکوس روی inputها
    document.addEventListener('focusin', function(e) {
        if (e.target.matches('input[type="text"], textarea')) {
            setCurrentInput(e.target);
        }
    });
    
    // شروع برنامه
    start();
});

// بقیه توابع دقیقاً مانند قبل باقی می‌مانند...
// شروع برنامه
function start() {
    AppState.sets.clear();
    AppState.nextSetId = 1;
    showMainMenu();
}

function showMainMenu() {
    document.getElementById("step").innerHTML = `
        <div class="step-container">
            <h3>منوی اصلی آزمایشگاه مجموعه‌ها</h3>
            <p>لطفاً عملیات مورد نظر را انتخاب کنید:</p>
            <div class="operations-grid">
                <button onclick="addNewSet()" class="btn-operation">➕ ایجاد مجموعه جدید</button>
                <button onclick="showAllSets()" class="btn-operation">📋 نمایش همه مجموعه‌ها</button>
                <button onclick="showSetOperations()" class="btn-operation">🧮 عملیات روی مجموعه‌ها</button>
                <button onclick="checkMembership()" class="btn-operation">🔍 بررسی عضویت</button>
                <button onclick="checkSubsets()" class="btn-operation">📊 بررسی زیرمجموعه‌ها</button>
                <button onclick="showUniversalSets()" class="btn-operation">🌍 مجموعه‌های جهانی</button>
                <button onclick="showVisualizations()" class="btn-operation">📈 نمایش گرافیکی</button>
            </div>
        </div>
    `;
}

function addNewSet() {
    document.getElementById("step").innerHTML = `
        <div class="step-container">
            <h3>ایجاد مجموعه جدید</h3>
            <p>لطفاً نوع ورودی مجموعه را انتخاب کنید:</p>
            
            <div class="input-type-selector">
                <button onclick="showSymbolicInput()" class="btn-type">
                    <strong>روش نمادین</strong><br>
                    <small>مثال: { x | x ∈ ℕ , 3 ≤ x ≤ 8 }</small>
                </button>
                
                <button onclick="showVerbalInput()" class="btn-type">
                    <strong>حالت کلامی</strong><br>
                    <small>مثال: اعداد فرد بین ۱ تا ۱۰</small>
                </button>
                
                <button onclick="showNormalInput()" class="btn-type">
                    <strong>حالت عادی</strong><br>
                    <small>مثال: 1,2,3,4,5</small>
                </button>
            </div>
            
            <div class="button-group">
                <button onclick="showMainMenu()" class="btn btn-secondary">🔙 بازگشت</button>
            </div>
        </div>
    `;
}

function showSymbolicInput() {
    document.getElementById("step").innerHTML = `
        <div class="step-container">
            <h3>📐 ایجاد مجموعه با روش نمادین</h3>
            <p>مجموعه را به صورت نمادین ریاضی وارد کنید:</p>
            
            <div class="form-group">
                <label class="form-label">نام مجموعه:</label>
                <input type="text" id="setName" class="form-input" placeholder="مثال: A, B, C, ..." onfocus="setCurrentInput(this)">
            </div>
            
            <div class="form-group">
                <label class="form-label">مجموعه نمادین:</label>
                <input type="text" id="setExpression" class="form-input" placeholder="مثال: { x | x ∈ ℕ , 3 ≤ x ≤ 8 }" onfocus="setCurrentInput(this)">
                <small style="color: #666; display: block; margin-top: 5px;">برای نمادهای ریاضی از کیبورد برنامه استفاده کنید</small>
            </div>
            
            <div class="examples">
                <strong>نمونه‌های روش نمادین:</strong>
                <ul>
                    <li>{ x | x ∈ ℕ , 3 ≤ x ≤ 8 }</li>
                    <li>{ x | x ∈ ℤ , x > 0 , x < 6 }</li>
                    <li>{ x | x = 2k , k ∈ ℕ , k ≤ 5 }</li>
                    <li>{ x | x ∈ ℕ , x فرد }</li>
                </ul>
            </div>
            
            <div class="button-group">
                <button onclick="saveSymbolicSet()" class="btn btn-success">💾 ذخیره مجموعه</button>
                <button onclick="addNewSet()" class="btn btn-secondary">🔙 بازگشت</button>
            </div>
        </div>
    `;
}

function showVerbalInput() {
    document.getElementById("step").innerHTML = `
        <div class="step-container">
            <h3>🗣️ ایجاد مجموعه با حالت کلامی</h3>
            <p>مجموعه را با توصیف کلامی وارد کنید:</p>
            
            <div class="form-group">
                <label class="form-label">نام مجموعه:</label>
                <input type="text" id="setName" class="form-input" placeholder="مثال: اعداد_فرد, اعداد_اول, ..." onfocus="setCurrentInput(this)">
            </div>
            
            <div class="form-group">
                <label class="form-label">توصیف مجموعه:</label>
                <textarea id="setDescription" class="form-input" rows="3" placeholder="مثال: اعداد طبیعی فرد بین ۱ تا ۱۰" onfocus="setCurrentInput(this)"></textarea>
            </div>
            
            <div class="examples">
                <strong>نمونه‌های حالت کلامی:</strong>
                <ul>
                    <li>اعداد طبیعی فرد بین ۱ تا ۱۰</li>
                    <li>اعداد اول کوچکتر از ۲۰</li>
                    <li>مضرب‌های ۳ بین ۱ تا ۳۰</li>
                    <li>اعداد زوج بین ۲ تا ۱۵</li>
                </ul>
            </div>
            
            <div class="button-group">
                <button onclick="saveVerbalSet()" class="btn btn-success">💾 ذخیره مجموعه</button>
                <button onclick="addNewSet()" class="btn btn-secondary">🔙 بازگشت</button>
            </div>
        </div>
    `;
}

function showNormalInput() {
    document.getElementById("step").innerHTML = `
        <div class="step-container">
            <h3>🔢 ایجاد مجموعه با حالت عادی</h3>
            <p>اعضای مجموعه را با کاما جدا کنید:</p>
            
            <div class="form-group">
                <label class="form-label">نام مجموعه:</label>
                <input type="text" id="setName" class="form-input" placeholder="مثال: A, B, C, ..." onfocus="setCurrentInput(this)">
            </div>
            
            <div class="form-group">
                <label class="form-label">اعضای مجموعه (با کاما جدا کنید):</label>
                <input type="text" id="setElements" class="form-input" placeholder="مثال: 1, 2, 3, 4, 5" onfocus="setCurrentInput(this)">
            </div>
            
            <div class="button-group">
                <button onclick="saveNormalSet()" class="btn btn-success">💾 ذخیره مجموعه</button>
                <button onclick="addNewSet()" class="btn btn-secondary">🔙 بازگشت</button>
            </div>
        </div>
    `;
}

// بقیه توابع دقیقاً مانند کد قبلی هستند (saveSymbolicSet, saveVerbalSet, saveNormalSet, etc.)
// فقط event listenerهای کیبورد و مدیریت موبایل اضافه شده

// [بقیه توابع دقیقاً مانند کد قبلی باقی می‌مانند...]
// به دلیل محدودیت طول پاسخ، توابع مشابه کد قبلی هستند

// توابع کمکی
function showMessage(message, type = 'info') {
    const stepSection = document.getElementById("step");
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
    stepSection.insertBefore(messageDiv, stepSection.firstChild);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function parseSet(input) {
    try {
        input = input.replace(/\s/g, '');
        
        if (input.startsWith('{') && input.endsWith('}')) {
            const content = input.slice(1, -1);
            if (content === '') return [];
            
            const elements = content.split(',').filter(item => item !== '');
            return elements.map(item => {
                const num = Number(item);
                return isNaN(num) ? item : num;
            });
        }
        
        return [];
    } catch (error) {
        return [];
    }
}

function formatSet(elements) {
    if (elements.length === 0) return '∅';
    return `{${elements.join(', ')}}`;
}