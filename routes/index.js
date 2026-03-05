const User = require('../models/User'); // Add this line!
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Fund = require('../models/Fund');
const moment = require('moment');

// Middleware to check authentication
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.isApproved) {
            return next(); // Fully authorized
        }
        // Logged in but not yet approved by you
        return res.render('pending'); 
    }
    res.redirect('/auth');
}
function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.username === 'Bismillah') {
        return next();
    }
    res.status(403).render('error', { 
        status: 403,
        title: "Access Denied",
        message: "You need administrator privileges to manage partners." 
    });
}
// --- DASHBOARD ---
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const funds = await Fund.find();

        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const totalCapital = funds.reduce((sum, f) => {
            return f.to === 'Business' ? sum + f.amount : sum;
        }, 0);

        res.render('index', { 
            totalSpent, 
            totalCapital,
            moment 
        });
    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).send("Server Error");
    }
});

// --- TRANSACTIONS ---
router.get('/expense', isLoggedIn, (req, res) => {
    res.render('expense');
});

router.post('/add-transaction', isLoggedIn, async (req, res) => {
    try {
        const { amount, date, description, paidBy } = req.body;
        const newEntry = new Transaction({ amount, date, description, paidBy });
        await newEntry.save();
        res.redirect('/'); 
    } catch (err) {
        res.status(500).send("Save Error: " + err.message);
    }
});

// --- HISTORY ---
router.get('/history', isLoggedIn, async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        const transactions = await Transaction.find(query).sort({ date: -1 });
        
        // 1. Calculate Totals
        let totalExpenses = 0;
        let totals = { Umer: 0, Waqar: 0, Zohaib: 0 };

        transactions.forEach(t => {
            totalExpenses += t.amount;
            if (totals.hasOwnProperty(t.paidBy)) {
                totals[t.paidBy] += t.amount;
            }
        });

        // 2. Calculate Balances (Spent - Fair Share)
        const sharePerPerson = totalExpenses / 3;
        const balances = {
            Umer: Math.round(totals.Umer - sharePerPerson),
            Waqar: Math.round(totals.Waqar - sharePerPerson),
            Zohaib: Math.round(totals.Zohaib - sharePerPerson)
        };

        res.render('history', { 
            transactions, 
            totals, 
            balances, 
            totalExpenses,
            moment, 
            startDate, 
            endDate 
        });
    } catch (err) {
        res.status(500).send("History Error: " + err.message);
    }
});
// --- SETTLEMENTS / FUNDS ---
router.get('/funds', isLoggedIn, async (req, res) => {
    try {
        const funds = await Fund.find().sort({ date: -1 });
        const transactions = await Transaction.find();
        const partners = ['Umer', 'Waqar', 'Zohaib'];

        // Reset everything to zero for this specific request
        let stats = {
            totalSpent: 0,
            spending: { Umer: 0, Waqar: 0, Zohaib: 0 },
            investment: { Umer: 0, Waqar: 0, Zohaib: 0 }
        };

        transactions.forEach(t => {
            stats.totalSpent += t.amount;
            if (stats.spending.hasOwnProperty(t.paidBy)) {
                stats.spending[t.paidBy] += t.amount;
            }
        });

        funds.forEach(f => {
            if (f.to === 'Business' && partners.includes(f.from)) {
                stats.investment[f.from] += f.amount;
            } 
            else if (f.from === 'Business' && partners.includes(f.to)) {
                stats.investment[f.to] -= f.amount;
            }
            else if (partners.includes(f.from) && partners.includes(f.to)) {
                stats.investment[f.from] += f.amount;
                stats.investment[f.to] -= f.amount;
            }
        });

        const perPersonTarget = stats.totalSpent > 0 ? Math.round(stats.totalSpent / 3) : 0;

        res.render('funds', { 
            funds, 
            stats, 
            perPersonTarget, 
            partners, 
            moment 
        });
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

router.post('/add-fund', isLoggedIn, async (req, res) => {
    try {
        await Fund.create(req.body);
        res.redirect('/funds');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 1. View User Management Page
router.get('/manage-partners', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ username: { $ne: req.user.username } }); // Show everyone except you
        res.render('manage-partners', { users });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 2. Toggle Access (Grant/Remove)
router.post('/toggle-access/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.isApproved = !user.isApproved; // Flip the status
        await user.save();
        res.redirect('/manage-partners');
    } catch (err) {
        res.status(500).send(err.message);
    }
});


module.exports = router;
