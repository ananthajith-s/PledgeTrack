const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  pledge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pledge',
    required: [true, 'Payment must be associated with a pledge']
  },
  
  amount: {
    type: Number,
    required: [true, 'Please provide payment amount'],
    min: [1, 'Payment amount must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Amount must be an integer'
    }
  },
  
  paidOn: {
    type: Date,
    default: Date.now
  },
  
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payment must be recorded by a user']
  },
  
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'online', 'other'],
    default: 'cash'
  },
  
  referenceNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference number cannot be more than 100 characters']
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);