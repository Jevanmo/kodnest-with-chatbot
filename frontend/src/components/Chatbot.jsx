import { useState, useRef, useEffect } from 'react'
import './Chatbot.css'

// ─── Loan product data ────────────────────────────────────────────────────────
const LOAN_PRODUCTS = {
    personal: {
        name: 'Personal Loan',
        icon: '👤',
        rate: '10.5% – 18%',
        amount: '₹50K – ₹40L',
        tenure: '1 – 5 years',
        minIncome: 25000,
        desc: 'Quick unsecured loan for any personal need — travel, medical, wedding, etc.',
        features: ['No collateral required', 'Instant approval', 'Flexible repayment'],
    },
    home: {
        name: 'Home Loan',
        icon: '🏠',
        rate: '8.5% – 10.5%',
        amount: '₹5L – ₹5Cr',
        tenure: '5 – 30 years',
        minIncome: 35000,
        desc: 'Build or buy your dream home with long-tenure low-rate loans.',
        features: ['Tax benefits u/s 80C & 24B', 'Low interest rate', 'Up to 30 yr tenure'],
    },
    car: {
        name: 'Car Loan',
        icon: '🚗',
        rate: '9% – 14%',
        amount: '₹1L – ₹1.5Cr',
        tenure: '1 – 7 years',
        minIncome: 20000,
        desc: 'Drive home your favourite vehicle with easy financing.',
        features: ['Up to 90% on-road price', 'Quick disbursal', 'Flexible EMI'],
    },
    education: {
        name: 'Education Loan',
        icon: '🎓',
        rate: '8% – 13%',
        amount: '₹50K – ₹75L',
        tenure: '5 – 15 years',
        minIncome: 0,
        desc: 'Fund your higher education in India or abroad.',
        features: ['Moratorium during study', 'Tax deduction u/s 80E', 'Covers fees + living'],
    },
    business: {
        name: 'Business Loan',
        icon: '💼',
        rate: '12% – 22%',
        amount: '₹1L – ₹2Cr',
        tenure: '1 – 7 years',
        minIncome: 50000,
        desc: 'Fuel your business growth with working capital or expansion loans.',
        features: ['No end-use restriction', 'Overdraft facility', 'GST invoice accepted'],
    },
}

// ─── EMI Calculator ───────────────────────────────────────────────────────────
function calcEMI(principal, annualRate, tenureMonths) {
    const r = annualRate / 12 / 100
    if (r === 0) return (principal / tenureMonths).toFixed(2)
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
    return emi.toFixed(2)
}

// ─── Simulated loan applications store (in-memory) ───────────────────────────
const applications = {}

function generateAppId() {
    return 'KBL' + Math.floor(100000 + Math.random() * 900000)
}

const STATUSES = ['Under Review', 'Document Verification', 'Credit Assessment', 'Approved', 'Disbursed']

// ─── Flow state machine ───────────────────────────────────────────────────────
const FLOWS = {
    IDLE: 'IDLE',
    EXPLORE: 'EXPLORE',
    ELIGIBILITY: 'ELIGIBILITY',
    EMI: 'EMI',
    APPLY: 'APPLY',
    STATUS: 'STATUS',
}

const ELIG_STEPS = ['age', 'income', 'employment', 'credit', 'loanType']
const EMI_STEPS = ['principal', 'rate', 'tenure']
const APPLY_STEPS = ['loanType', 'amount', 'name', 'email', 'confirm']

// ─── Helper: bold text renderer ───────────────────────────────────────────────
function renderText(text) {
    return text.split('\n').map((line, i, arr) => {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
            <span key={i}>
                {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
                {i < arr.length - 1 && <br />}
            </span>
        )
    })
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [flow, setFlow] = useState(FLOWS.IDLE)
    const [flowStep, setFlowStep] = useState(0)
    const [flowData, setFlowData] = useState({})
    const [quickReplies, setQuickReplies] = useState([])
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Init greeting on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            pushBot(
                '👋 Welcome to **LoanAssist** — your KodBank AI Loan Advisor!\n\nI can help you with:\n• 🏦 Explore loan products\n• ✅ Check your eligibility\n• 🧮 Calculate EMI\n• 📝 Apply for a loan\n• 🔍 Track loan status\n\nWhat would you like to do today?',
                [
                    { label: '🏦 Explore Loans', value: 'explore loans' },
                    { label: '✅ Check Eligibility', value: 'check eligibility' },
                    { label: '🧮 EMI Calculator', value: 'emi calculator' },
                    { label: '📝 Apply for Loan', value: 'apply loan' },
                    { label: '🔍 Track Status', value: 'track status' },
                ]
            )
        }
    }, [isOpen])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    useEffect(() => {
        if (isOpen) inputRef.current?.focus()
    }, [isOpen])

    // ── message helpers ──────────────────────────────────────────────────────────
    const pushMsg = (from, text, chips = [], special = null) => {
        const msg = {
            id: Date.now() + Math.random(),
            from,
            text,
            chips,
            special,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, msg])
    }

    const pushUser = (text) => pushMsg('user', text)

    const pushBot = (text, chips = [], special = null) => {
        setQuickReplies(chips)
        pushMsg('bot', text, chips, special)
    }

    const botReply = (text, chips = [], special = null, delay = 850) => {
        setIsTyping(true)
        setTimeout(() => {
            setIsTyping(false)
            pushBot(text, chips, special)
        }, delay)
    }

    // ── input entry point ────────────────────────────────────────────────────────
    const send = (rawInput) => {
        const text = (rawInput ?? inputValue).trim()
        if (!text) return
        setInputValue('')
        setQuickReplies([])
        pushUser(text)
        processInput(text)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    }

    // ── reset ────────────────────────────────────────────────────────────────────
    const resetToIdle = (msg, chips) => {
        setFlow(FLOWS.IDLE)
        setFlowStep(0)
        setFlowData({})
        botReply(msg, chips)
    }

    const mainMenu = (prefix = '') => {
        resetToIdle(
            (prefix ? prefix + '\n\n' : '') + 'What else can I help you with?',
            [
                { label: '🏦 Explore Loans', value: 'explore loans' },
                { label: '✅ Check Eligibility', value: 'check eligibility' },
                { label: '🧮 EMI Calculator', value: 'emi calculator' },
                { label: '📝 Apply for Loan', value: 'apply loan' },
                { label: '🔍 Track Status', value: 'track status' },
            ]
        )
    }

    // ────────────────────────────────────────────────────────────────────────────
    // FLOW: ELIGIBILITY
    // ────────────────────────────────────────────────────────────────────────────
    const startEligibility = () => {
        setFlow(FLOWS.ELIGIBILITY)
        setFlowStep(0)
        setFlowData({})
        botReply('Sure! Let\'s check your loan eligibility in a few quick steps.\n\n**Step 1/5:** What is your age?', [
            { label: '18–25', value: '22' },
            { label: '26–35', value: '30' },
            { label: '36–50', value: '40' },
            { label: '51+', value: '55' },
        ])
    }

    const handleEligibility = (text) => {
        const step = ELIG_STEPS[flowStep]

        if (step === 'age') {
            const age = parseInt(text)
            if (isNaN(age) || age < 18 || age > 70) {
                botReply('⚠️ Please enter a valid age between 18 and 70.')
                return
            }
            setFlowData(p => ({ ...p, age }))
            setFlowStep(1)
            botReply('**Step 2/5:** What is your monthly income? (in ₹)', [
                { label: 'Below ₹20K', value: '15000' },
                { label: '₹20K–₹50K', value: '35000' },
                { label: '₹50K–₹1L', value: '75000' },
                { label: 'Above ₹1L', value: '150000' },
            ])
            return
        }

        if (step === 'income') {
            const income = parseInt(text.replace(/,/g, ''))
            if (isNaN(income) || income < 0) {
                botReply('⚠️ Please enter a valid monthly income in ₹.')
                return
            }
            setFlowData(p => ({ ...p, income }))
            setFlowStep(2)
            botReply('**Step 3/5:** What is your employment type?', [
                { label: '💼 Salaried', value: 'salaried' },
                { label: '🏢 Self-Employed', value: 'self-employed' },
                { label: '🎓 Student', value: 'student' },
                { label: '🏠 Retired', value: 'retired' },
            ])
            return
        }

        if (step === 'employment') {
            const employment = text.toLowerCase()
            setFlowData(p => ({ ...p, employment }))
            setFlowStep(3)
            botReply('**Step 4/5:** What is your approximate credit score?', [
                { label: '🔴 Below 650', value: '600' },
                { label: '🟡 650–749', value: '700' },
                { label: '🟢 750–799', value: '775' },
                { label: '⭐ 800+', value: '820' },
            ])
            return
        }

        if (step === 'credit') {
            const credit = parseInt(text)
            if (isNaN(credit) || credit < 300 || credit > 900) {
                botReply('⚠️ Please enter a credit score between 300 and 900.')
                return
            }
            setFlowData(p => ({ ...p, credit }))
            setFlowStep(4)
            botReply('**Step 5/5:** Which loan type are you interested in?', [
                { label: '👤 Personal', value: 'personal' },
                { label: '🏠 Home', value: 'home' },
                { label: '🚗 Car', value: 'car' },
                { label: '🎓 Education', value: 'education' },
                { label: '💼 Business', value: 'business' },
            ])
            return
        }

        if (step === 'loanType') {
            const key = text.toLowerCase()
            const product = LOAN_PRODUCTS[key] || Object.values(LOAN_PRODUCTS).find(p => p.name.toLowerCase().includes(key))
            const finalData = { ...flowData, loanType: key }
            setFlowData(finalData)
            setFlow(FLOWS.IDLE)
            setFlowStep(0)

            // Determine eligibility
            const { age, income, employment, credit } = finalData
            const eligible = []
            const notEligible = []

            Object.entries(LOAN_PRODUCTS).forEach(([k, prod]) => {
                const reasons = []
                if (income < prod.minIncome && employment !== 'student') reasons.push(`min income ₹${prod.minIncome.toLocaleString()}`)
                if (credit < 650 && k !== 'education') reasons.push('credit score < 650')
                if (age < 18 || age > 65) reasons.push('age criteria not met')
                if (reasons.length === 0) eligible.push(prod.name + ' ' + prod.icon)
                else notEligible.push(`${prod.icon} ${prod.name} (${reasons.join(', ')})`)
            })

            const creditMsg = credit >= 750 ? '🟢 Excellent' : credit >= 650 ? '🟡 Good' : '🔴 Low'

            botReply(
                `✅ **Eligibility Report**\n\n` +
                `📋 Age: ${age} yrs | Income: ₹${income.toLocaleString()}/mo\n` +
                `💳 Credit Score: ${credit} (${creditMsg})\n\n` +
                `**Eligible for:**\n${eligible.map(e => '• ' + e).join('\n')}\n\n` +
                (notEligible.length ? `**Not yet eligible:**\n${notEligible.map(e => '• ' + e).join('\n')}\n\n` : '') +
                (credit < 650 ? '💡 *Tip: Improving your credit score above 750 unlocks better rates!*' : '🎉 Great profile! You qualify for excellent rates.'),
                [
                    { label: '📝 Apply Now', value: 'apply loan' },
                    { label: '🧮 Calculate EMI', value: 'emi calculator' },
                    { label: '🏠 Main Menu', value: 'menu' },
                ]
            )
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // FLOW: EMI CALCULATOR
    // ────────────────────────────────────────────────────────────────────────────
    const startEMI = () => {
        setFlow(FLOWS.EMI)
        setFlowStep(0)
        setFlowData({})
        botReply('🧮 **EMI Calculator**\n\nLet\'s calculate your monthly installment!\n\n**Step 1/3:** Enter the loan amount (₹)', [
            { label: '₹1 Lakh', value: '100000' },
            { label: '₹5 Lakh', value: '500000' },
            { label: '₹10 Lakh', value: '1000000' },
            { label: '₹25 Lakh', value: '2500000' },
        ])
    }

    const handleEMI = (text) => {
        const step = EMI_STEPS[flowStep]

        if (step === 'principal') {
            const amt = parseFloat(text.replace(/,/g, '').replace('₹', ''))
            if (isNaN(amt) || amt <= 0) {
                botReply('⚠️ Please enter a valid loan amount in ₹.')
                return
            }
            setFlowData(p => ({ ...p, principal: amt }))
            setFlowStep(1)
            botReply(`**Step 2/3:** Enter the **annual interest rate** (in %)\n\n*Common rates: Personal 12%, Home 9%, Car 10%*`, [
                { label: '8.5%', value: '8.5' },
                { label: '10%', value: '10' },
                { label: '12%', value: '12' },
                { label: '15%', value: '15' },
            ])
            return
        }

        if (step === 'rate') {
            const rate = parseFloat(text.replace('%', ''))
            if (isNaN(rate) || rate <= 0 || rate > 50) {
                botReply('⚠️ Please enter a valid interest rate (e.g. 10.5).')
                return
            }
            setFlowData(p => ({ ...p, rate }))
            setFlowStep(2)
            botReply(`**Step 3/3:** Enter the **loan tenure** (in months or years)\n\n*E.g. "24 months" or "2 years"*`, [
                { label: '1 Year', value: '12 months' },
                { label: '2 Years', value: '24 months' },
                { label: '5 Years', value: '60 months' },
                { label: '10 Years', value: '120 months' },
            ])
            return
        }

        if (step === 'tenure') {
            let months
            const lowerText = text.toLowerCase()
            if (lowerText.includes('year')) {
                const yr = parseFloat(lowerText)
                months = Math.round(yr * 12)
            } else {
                months = parseInt(lowerText)
            }

            if (isNaN(months) || months <= 0 || months > 360) {
                botReply('⚠️ Please enter a valid tenure (e.g. "24 months" or "2 years").')
                return
            }

            const { principal, rate } = flowData
            const emi = calcEMI(principal, rate, months)
            const totalPayment = (parseFloat(emi) * months).toFixed(2)
            const totalInterest = (totalPayment - principal).toFixed(2)

            setFlow(FLOWS.IDLE)
            setFlowStep(0)
            setFlowData({})

            botReply(
                `✅ **EMI Calculation Result**\n\n` +
                `💰 Loan Amount: **₹${principal.toLocaleString()}**\n` +
                `📈 Interest Rate: **${rate}% p.a.**\n` +
                `📅 Tenure: **${months} months** (${(months / 12).toFixed(1)} yrs)\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `🏦 Monthly EMI: **₹${parseFloat(emi).toLocaleString()}**\n` +
                `💵 Total Payment: **₹${parseFloat(totalPayment).toLocaleString()}**\n` +
                `📊 Total Interest: **₹${parseFloat(totalInterest).toLocaleString()}**\n` +
                `━━━━━━━━━━━━━━━━━`,
                [
                    { label: '📝 Apply Now', value: 'apply loan' },
                    { label: '🔄 Calculate Again', value: 'emi calculator' },
                    { label: '🏠 Main Menu', value: 'menu' },
                ],
                { type: 'emi', emi, principal, rate, months, totalPayment, totalInterest }
            )
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // FLOW: LOAN APPLICATION
    // ────────────────────────────────────────────────────────────────────────────
    const startApply = () => {
        setFlow(FLOWS.APPLY)
        setFlowStep(0)
        setFlowData({})
        botReply('📝 **Loan Application**\n\nGreat! Let\'s get started.\n\n**Step 1/4:** Which loan type would you like to apply for?', [
            { label: '👤 Personal Loan', value: 'personal' },
            { label: '🏠 Home Loan', value: 'home' },
            { label: '🚗 Car Loan', value: 'car' },
            { label: '🎓 Education Loan', value: 'education' },
            { label: '💼 Business Loan', value: 'business' },
        ])
    }

    const handleApply = (text) => {
        const step = APPLY_STEPS[flowStep]

        if (step === 'loanType') {
            const key = text.toLowerCase()
            const product = LOAN_PRODUCTS[key] || Object.values(LOAN_PRODUCTS).find(p => p.name.toLowerCase().includes(key))
            if (!product) {
                botReply('⚠️ Please choose a valid loan type.', [
                    { label: '👤 Personal', value: 'personal' },
                    { label: '🏠 Home', value: 'home' },
                    { label: '🚗 Car', value: 'car' },
                    { label: '🎓 Education', value: 'education' },
                    { label: '💼 Business', value: 'business' },
                ])
                return
            }
            setFlowData(p => ({ ...p, loanType: product.name, loanKey: key }))
            setFlowStep(1)
            botReply(`**Step 2/4:** How much loan amount do you need? (₹)\n\n*${product.name} range: ${product.amount}*`, [
                { label: '₹1 Lakh', value: '100000' },
                { label: '₹5 Lakh', value: '500000' },
                { label: '₹10 Lakh', value: '1000000' },
                { label: '₹25 Lakh', value: '2500000' },
            ])
            return
        }

        if (step === 'amount') {
            const amount = parseFloat(text.replace(/,/g, '').replace('₹', ''))
            if (isNaN(amount) || amount <= 0) {
                botReply('⚠️ Please enter a valid loan amount in ₹.')
                return
            }
            setFlowData(p => ({ ...p, amount }))
            setFlowStep(2)
            botReply('**Step 3/4:** Please enter your **full name**.')
            return
        }

        if (step === 'name') {
            if (text.length < 2) {
                botReply('⚠️ Please enter your full name.')
                return
            }
            setFlowData(p => ({ ...p, name: text }))
            setFlowStep(3)
            botReply(`Thanks, **${text}**! 😊\n\n**Step 4/4:** Please enter your **email address**.`)
            return
        }

        if (step === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(text)) {
                botReply('⚠️ Please enter a valid email address.')
                return
            }
            const updatedData = { ...flowData, email: text }
            setFlowData(updatedData)
            setFlowStep(4)
            botReply(
                `📋 **Please confirm your application:**\n\n` +
                `• Loan Type: **${updatedData.loanType}**\n` +
                `• Amount: **₹${updatedData.amount.toLocaleString()}**\n` +
                `• Name: **${updatedData.name}**\n` +
                `• Email: **${text}**\n\nShall I submit this application?`,
                [
                    { label: '✅ Yes, Submit', value: 'yes' },
                    { label: '❌ Cancel', value: 'cancel' },
                ]
            )
            return
        }

        if (step === 'confirm') {
            const lower = text.toLowerCase()
            if (lower === 'yes' || lower === 'submit' || lower === 'yes, submit') {
                const appId = generateAppId()
                applications[appId] = {
                    ...flowData,
                    appId,
                    status: 'Under Review',
                    submittedAt: new Date().toLocaleString(),
                }
                setFlow(FLOWS.IDLE)
                setFlowStep(0)
                setFlowData({})
                botReply(
                    `🎉 **Application Submitted Successfully!**\n\n` +
                    `📄 Application ID: **${appId}**\n` +
                    `Status: 🔄 Under Review\n\n` +
                    `📧 A confirmation will be sent to **${flowData.email}**\n\n` +
                    `💡 Save your Application ID to track status later!`,
                    [
                        { label: '🔍 Track My Application', value: `track ${appId}` },
                        { label: '🏠 Main Menu', value: 'menu' },
                    ]
                )
            } else {
                setFlow(FLOWS.IDLE)
                setFlowStep(0)
                setFlowData({})
                mainMenu('Application cancelled. No worries!')
            }
            return
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // FLOW: STATUS TRACKER
    // ────────────────────────────────────────────────────────────────────────────
    const startStatus = () => {
        setFlow(FLOWS.STATUS)
        setFlowStep(0)
        botReply('🔍 **Loan Status Tracker**\n\nPlease enter your **Application ID** (e.g. KBL123456).')
    }

    const handleStatus = (text) => {
        const id = text.trim().toUpperCase()
        setFlow(FLOWS.IDLE)
        setFlowStep(0)

        // Check in-memory store
        if (applications[id]) {
            const app = applications[id]
            const statusIdx = STATUSES.indexOf(app.status)
            const progressBar = STATUSES.map((s, i) =>
                i <= statusIdx ? '🟢' : '⚪'
            ).join(' → ')
            botReply(
                `📋 **Application Status**\n\n` +
                `ID: **${id}**\n` +
                `Loan: **${app.loanType}**\n` +
                `Amount: **₹${app.amount.toLocaleString()}**\n` +
                `Applicant: **${app.name}**\n\n` +
                `Status: **${app.status}**\n` +
                `${progressBar}`,
                [{ label: '🏠 Main Menu', value: 'menu' }]
            )
        } else if (id.startsWith('KBL')) {
            // Simulate status for demo IDs
            const demoStatuses = ['Document Verification', 'Credit Assessment', 'Approved']
            const randStatus = demoStatuses[Math.floor(Math.random() * demoStatuses.length)]
            const statusIdx = STATUSES.indexOf(randStatus)
            const progressBar = STATUSES.map((s, i) =>
                i <= statusIdx ? '🟢' : '⚪'
            ).join(' → ')
            botReply(
                `📋 **Application Status**\n\n` +
                `ID: **${id}**\n` +
                `Status: **${randStatus}**\n` +
                `${progressBar}\n\n` +
                `⏱ Expected completion: 2–3 business days`,
                [{ label: '🏠 Main Menu', value: 'menu' }]
            )
        } else {
            botReply(
                `❌ Application ID **${id}** not found.\n\nApplication IDs start with **KBL** followed by 6 digits.\n\nIf you applied recently, please try again after a few minutes.`,
                [
                    { label: '🔄 Try Again', value: 'track status' },
                    { label: '🏠 Main Menu', value: 'menu' },
                ]
            )
        }
    }

    // ── EXPLORE FLOW ─────────────────────────────────────────────────────────────
    const handleExplore = (text) => {
        const key = text.toLowerCase()
        const product = LOAN_PRODUCTS[key] || Object.values(LOAN_PRODUCTS).find(
            p => p.name.toLowerCase().includes(key)
        )
        if (product) {
            setFlow(FLOWS.IDLE)
            botReply(
                `${product.icon} **${product.name}**\n\n` +
                `📌 ${product.desc}\n\n` +
                `💰 Amount: **${product.amount}**\n` +
                `📈 Rate: **${product.rate} p.a.**\n` +
                `📅 Tenure: **${product.tenure}**\n\n` +
                `✨ **Features:**\n${product.features.map(f => '• ' + f).join('\n')}`,
                [
                    { label: '📝 Apply for this Loan', value: `apply ${key}` },
                    { label: '🧮 Calculate EMI', value: 'emi calculator' },
                    { label: '✅ Check Eligibility', value: 'check eligibility' },
                    { label: '🔙 See All Loans', value: 'explore loans' },
                ]
            )
            return true
        }
        return false
    }

    // ── MAIN INPUT PROCESSOR ─────────────────────────────────────────────────────
    const processInput = (text) => {
        const lower = text.toLowerCase()

        // Active flow routing
        if (flow === FLOWS.ELIGIBILITY) { handleEligibility(text); return }
        if (flow === FLOWS.EMI) { handleEMI(text); return }
        if (flow === FLOWS.STATUS) { handleStatus(text); return }
        if (flow === FLOWS.APPLY) { handleApply(text); return }

        // Intent detection (IDLE)
        if (lower.includes('menu') || lower === 'hi' || lower === 'hello' || lower === 'hey') {
            mainMenu('👋 Welcome back!')
            return
        }
        if (lower.includes('explore') || lower.includes('loan type') || lower.includes('product') || lower.includes('what loan')) {
            setFlow(FLOWS.EXPLORE)
            botReply(
                '🏦 **Our Loan Products**\n\nChoose a loan to learn more:',
                [
                    { label: '👤 Personal Loan', value: 'personal' },
                    { label: '🏠 Home Loan', value: 'home' },
                    { label: '🚗 Car Loan', value: 'car' },
                    { label: '🎓 Education Loan', value: 'education' },
                    { label: '💼 Business Loan', value: 'business' },
                ]
            )
            return
        }
        if (lower.includes('eligib')) { startEligibility(); return }
        if (lower.includes('emi') || lower.includes('calculat')) { startEMI(); return }
        if (lower.includes('apply')) {
            // Check if specific loan type mentioned
            const found = Object.keys(LOAN_PRODUCTS).find(k => lower.includes(k))
            if (found) {
                setFlowData({ loanType: LOAN_PRODUCTS[found].name, loanKey: found })
                setFlow(FLOWS.APPLY)
                setFlowStep(1)
                botReply(`📝 **${LOAN_PRODUCTS[found].name} Application**\n\nHow much loan amount do you need? (₹)\n\n*Range: ${LOAN_PRODUCTS[found].amount}*`, [
                    { label: '₹1 Lakh', value: '100000' },
                    { label: '₹5 Lakh', value: '500000' },
                    { label: '₹10 Lakh', value: '1000000' },
                    { label: '₹25 Lakh', value: '2500000' },
                ])
                return
            }
            startApply()
            return
        }
        if (lower.includes('track') || lower.includes('status') || lower.includes('application')) {
            // Check if ID embedded in message
            const match = text.match(/KBL\d{6}/i)
            if (match) {
                setFlow(FLOWS.STATUS)
                handleStatus(match[0])
                return
            }
            startStatus()
            return
        }

        // Explore flow sub-product selection
        if (flow === FLOWS.EXPLORE) {
            if (handleExplore(text)) return
        }

        // General product keyword
        const productMatch = Object.keys(LOAN_PRODUCTS).find(k => lower.includes(k))
        if (productMatch) {
            handleExplore(productMatch)
            return
        }

        // Banking fallback
        if (lower.includes('balance')) {
            botReply('Your account balance is shown on the **dashboard**. Click "Check Balance" to reveal it!', [{ label: '🏠 Main Menu', value: 'menu' }])
            return
        }
        if (lower.includes('transfer')) {
            botReply('To transfer money, use the **Transfer Money** section on your dashboard. Fill in the recipient email and amount!', [{ label: '🏠 Main Menu', value: 'menu' }])
            return
        }
        if (lower.includes('interest rate') || lower.includes('rate')) {
            botReply('Here are our current rates:\n\n• Personal Loan: **10.5–18% p.a.**\n• Home Loan: **8.5–10.5% p.a.**\n• Car Loan: **9–14% p.a.**\n• Education Loan: **8–13% p.a.**\n• Business Loan: **12–22% p.a.**', [
                { label: '🧮 Calculate EMI', value: 'emi calculator' },
                { label: '📝 Apply Now', value: 'apply loan' },
            ])
            return
        }

        // Default
        botReply(
            'I\'m not sure about that 🤔\n\nI\'m best at helping with **loans**! Try one of these:',
            [
                { label: '🏦 Explore Loans', value: 'explore loans' },
                { label: '✅ Check Eligibility', value: 'check eligibility' },
                { label: '🧮 EMI Calculator', value: 'emi calculator' },
                { label: '📝 Apply for Loan', value: 'apply loan' },
            ]
        )
    }

    // ────────────────────────────────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────────────────────────────────
    return (
        <div className="chatbot-wrapper">
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar-wrap">
                                <span className="chatbot-avatar-icon">🏦</span>
                            </div>
                            <div>
                                <div className="chatbot-name">LoanAssist AI</div>
                                <div className="chatbot-status">
                                    <span className="status-dot" /> KodBank Loan Advisor
                                </div>
                            </div>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)} aria-label="Close">✕</button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`chatbot-message-row ${msg.from === 'user' ? 'user-row' : 'bot-row'}`}>
                                {msg.from === 'bot' && <div className="bot-bubble-avatar">🏦</div>}
                                <div className={`chatbot-bubble ${msg.from === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                                    <div className="bubble-text">{renderText(msg.text)}</div>
                                    {msg.special?.type === 'emi' && (
                                        <div className="emi-visual">
                                            <div className="emi-bar-label">Principal</div>
                                            <div className="emi-bar-track">
                                                <div
                                                    className="emi-bar-fill principal-fill"
                                                    style={{ width: `${Math.min(100, (msg.special.principal / parseFloat(msg.special.totalPayment)) * 100).toFixed(0)}%` }}
                                                />
                                            </div>
                                            <div className="emi-bar-label">Interest</div>
                                            <div className="emi-bar-track">
                                                <div
                                                    className="emi-bar-fill interest-fill"
                                                    style={{ width: `${Math.min(100, (parseFloat(msg.special.totalInterest) / parseFloat(msg.special.totalPayment)) * 100).toFixed(0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="bubble-time">{msg.time}</div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="chatbot-message-row bot-row">
                                <div className="bot-bubble-avatar">🏦</div>
                                <div className="chatbot-bubble bot-bubble typing-bubble">
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick reply chips */}
                    {quickReplies.length > 0 && (
                        <div className="chatbot-suggestions">
                            {quickReplies.map(chip => (
                                <button
                                    key={chip.value}
                                    className="suggestion-chip"
                                    onClick={() => send(chip.value)}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="chatbot-input-area">
                        <input
                            ref={inputRef}
                            type="text"
                            className="chatbot-input"
                            placeholder="Type a message or pick an option..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKey}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={() => send()}
                            disabled={!inputValue.trim()}
                            aria-label="Send"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                className={`chatbot-fab ${isOpen ? 'fab-open' : ''}`}
                onClick={() => setIsOpen(p => !p)}
                aria-label="Open LoanAssist"
            >
                {isOpen ? '✕' : '🏦'}
            </button>
        </div>
    )
}

export default Chatbot
