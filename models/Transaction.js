const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // The amount in PKR
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'] 
    },
    
    // The date selected via Flatpickr
    date: { 
        type: Date, 
        required: [true, 'Date is required'],
        default: Date.now 
    },
    
    // Detailed description of the expense or sale
    description: { 
        type: String, 
        trim: true 
    },
    
    // Who made the transaction (Umer, Waqar, or Zohaib)
    paidBy: { 
        type: String, 
        required: true,
        enum: ['Umer', 'Waqar', 'Zohaib'] // Restricts data to only these 3 names
    },
    
    // Timestamp for when the entry was created in the system
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);